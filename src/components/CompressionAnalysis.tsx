import { useState, useEffect } from "preact/hooks";
import * as pako from "pako";
import brotliPromise from "brotli-wasm";
import { init as initZstd, compress as zstdCompress } from "@bokuweb/zstd-wasm";
import type { CompressionResult } from "../types";

// Initialize brotli-wasm once
let brotliModule: any = null;
const initBrotli = async () => {
  if (!brotliModule) {
    try {
      brotliModule = await brotliPromise;
    } catch (error) {
      console.warn(
        "Failed to load brotli-wasm, will skip brotli compression:",
        error,
      );
      brotliModule = false;
    }
  }
  return brotliModule;
};

// Initialize zstd-wasm once
let zstdAvailable: boolean | undefined;
const initZstdModule = async () => {
  if (zstdAvailable === undefined) {
    try {
      await initZstd();
    } catch (error) {
      console.warn(
        "Failed to load zstd-wasm, will skip zstd compression:",
        error,
      );
      zstdAvailable = false;
    }
  }
  return (zstdAvailable = true);
};

interface CompressionAnalysisProps {
  tarballUrl: string;
  onResults: (
    results: CompressionResult[],
    originalSize: number,
    originalGzippedSize: number,
  ) => void;
  onProgress?: (
    result: CompressionResult,
    currentResults: CompressionResult[],
    totalExpected: number,
  ) => void;
  onError: (error: string) => void;
}

export function CompressionAnalysis({
  tarballUrl,
  onResults,
  onProgress,
  onError,
}: CompressionAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [brotliAvailable, setBrotliAvailable] = useState<boolean | null>(null);
  const [zstdAvailable, setZstdAvailable] = useState<boolean | null>(null);

  // Test brotli and zstd availability on component mount
  useEffect(() => {
    Promise.all([
      initBrotli().then((brotli) => {
        setBrotliAvailable(!!brotli);
      }),
      initZstdModule().then((zstd) => {
        setZstdAvailable(!!zstd);
      }),
    ]);
  }, []);

  const compressWithGzip = async (
    tarData: ArrayBuffer,
    level: number,
  ): Promise<CompressionResult> => {
    const startTime = performance.now();

    // Convert ArrayBuffer to Uint8Array for pako
    const uint8Array = new Uint8Array(tarData);

    // Use pako with the specified compression level (1-9)
    // Ensure level is within valid range for pako
    const validLevel = Math.max(1, Math.min(9, level)) as
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
      | 8
      | 9;
    const compressed = pako.gzip(uint8Array, { level: validLevel });

    const endTime = performance.now();
    const compressionRatio = (1 - compressed.length / tarData.byteLength) * 100;

    return {
      level,
      size: compressed.length,
      compressionRatio,
      timeTaken: endTime - startTime,
      method: "gzip",
    };
  };

  const compressWithBrotli = async (
    tarData: ArrayBuffer,
    level: number,
  ): Promise<CompressionResult | null> => {
    const startTime = performance.now();

    try {
      // Initialize brotli-wasm
      const brotli = await initBrotli();
      if (!brotli) {
        return null; // Brotli not available
      }

      // Convert ArrayBuffer to Uint8Array for brotli-wasm
      const uint8Array = new Uint8Array(tarData);

      // Use brotli-wasm with the specified compression level (1-11)
      // Ensure level is within valid range for brotli
      const validLevel = Math.max(1, Math.min(11, level));

      const compressed = brotli.compress(uint8Array, { quality: validLevel });

      const endTime = performance.now();
      const compressionRatio =
        (1 - compressed.length / tarData.byteLength) * 100;

      return {
        level,
        size: compressed.length,
        compressionRatio,
        timeTaken: endTime - startTime,
        method: "brotli",
      };
    } catch (error) {
      console.warn(`Failed to compress with brotli level ${level}:`, error);
      return null;
    }
  };

  const compressWithZstd = async (
    tarData: ArrayBuffer,
    level: number,
  ): Promise<CompressionResult | null> => {
    const startTime = performance.now();

    try {
      // Initialize zstd-wasm
      const zstd = await initZstdModule();
      if (!zstd) {
        return null; // Zstd not available
      }

      // Convert ArrayBuffer to Uint8Array for zstd-wasm
      const uint8Array = new Uint8Array(tarData);

      // Use zstd-wasm with the specified compression level (1-22)
      // Ensure level is within valid range for zstd
      const validLevel = Math.max(1, Math.min(22, level));

      const compressed = zstdCompress(uint8Array, validLevel);

      const endTime = performance.now();
      const compressionRatio =
        (1 - compressed.length / tarData.byteLength) * 100;

      return {
        level,
        size: compressed.length,
        compressionRatio,
        timeTaken: endTime - startTime,
        method: "zstd",
      };
    } catch (error) {
      console.warn(`Failed to compress with zstd level ${level}:`, error);
      return null;
    }
  };

  const analyzeCompression = async () => {
    setLoading(true);

    try {
      // Fetch the tarball (which is already gzipped)
      const response = await fetch(tarballUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch package tarball");
      }

      const gzippedTarballData = await response.arrayBuffer();
      const originalGzippedSize = gzippedTarballData.byteLength;

      // First, decompress the gzipped tarball to get the raw tar data
      const gzippedUint8Array = new Uint8Array(gzippedTarballData);
      let tarData: Uint8Array;

      try {
        tarData = pako.ungzip(gzippedUint8Array);
      } catch (decompressError) {
        throw new Error(
          "Failed to decompress the tarball. The file may not be properly gzipped.",
        );
      }

      const originalSize = tarData.length;

      // Calculate total expected results
      const gzipLevels = 9;
      const brotliLevels = brotliAvailable ? 6 : 0; // Brotli levels 1, 3, 5, 7, 9, 11
      const zstdLevels = zstdAvailable ? 8 : 0; // Zstd levels 1, 4, 7, 10, 13, 16, 19, 22
      const totalExpected = gzipLevels + brotliLevels + zstdLevels;

      // Test different compression levels and methods on the raw tar data
      const results: CompressionResult[] = [];

      // Test gzip compression levels 1-9
      for (let level = 1; level <= 9; level++) {
        const result = await compressWithGzip(tarData.buffer, level);
        results.push(result);

        // Provide real-time progress update
        if (onProgress) {
          onProgress(result, [...results], totalExpected);
        }
      }

      // Test brotli compression levels 1-11 (only if brotli is available)
      if (brotliAvailable) {
        for (let level = 1; level <= 11; level += 2) {
          const result = await compressWithBrotli(tarData.buffer, level);
          if (result) {
            results.push(result);

            // Provide real-time progress update
            if (onProgress) {
              onProgress(result, [...results], totalExpected);
            }
          }
        }
      }

      // Test zstd compression levels 1-22 (only if zstd is available)
      if (zstdAvailable) {
        for (let level = 1; level <= 22; level += 3) {
          const result = await compressWithZstd(tarData.buffer, level);
          if (result) {
            results.push(result);

            // Provide real-time progress update
            if (onProgress) {
              onProgress(result, [...results], totalExpected);
            }
          }
        }
      }

      onResults(results, originalSize, originalGzippedSize);
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Failed to analyze compression",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="compression-section">
      <h3>Compression Analysis</h3>
      <p>
        Compare how different gzip, brotli, and zstd compression levels affect
        the package tarball size
      </p>
      <p>
        The original tarball is already gzipped, so we will decompress it
        first, then apply different compression methods and levels to the raw
        tar data.
      </p>
      <button
        onClick={analyzeCompression}
        className="analyze-btn"
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Analyze Compression"}
      </button>
    </div>
  );
}
