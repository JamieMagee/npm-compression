import { useState } from "preact/hooks";
import {
  SearchForm,
  ErrorDisplay,
  PackageDetails,
  CompressionAnalysis,
  CompressionResults,
  CompressionChart,
  BandwidthSavings,
} from "./components";
import { useNpmSearch } from "./hooks/useNpmSearch";
import type { CompressionResult } from "./types";
import "./app.css";

export function App() {
  const { packageInfo, loading, error, searchPackage } = useNpmSearch();
  const [compressionResults, setCompressionResults] = useState<
    CompressionResult[]
  >([]);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [originalGzippedSize, setOriginalGzippedSize] = useState<number>(0);
  const [compressionProgress, setCompressionProgress] = useState<{
    current: number;
    total: number;
    currentMethod?: string;
    currentLevel?: number;
  }>({ current: 0, total: 0 });

  const handleSearch = (query: string) => {
    // Reset compression results when searching for a new package
    setCompressionResults([]);
    setOriginalSize(0);
    setOriginalGzippedSize(0);
    setCompressionProgress({ current: 0, total: 0 });
    searchPackage(query);
  };

  const handleCompressionResults = (
    results: CompressionResult[],
    origSize: number,
    origGzippedSize: number,
  ) => {
    setCompressionResults(results);
    setOriginalSize(origSize);
    setOriginalGzippedSize(origGzippedSize);
    setCompressionProgress({ current: results.length, total: results.length });
  };

  const handleCompressionProgress = (
    result: CompressionResult,
    currentResults: CompressionResult[],
    totalExpected: number,
  ) => {
    setCompressionResults([...currentResults]);
    setCompressionProgress({
      current: currentResults.length,
      total: totalExpected,
      currentMethod: result.method,
      currentLevel: result.level,
    });
  };

  return (
    <div className="search-container">
      <h1>NPM compression comparison</h1>
      <p>Search for an NPM package to analyze its tarball compression.</p>

      <SearchForm onSearch={handleSearch} loading={loading} />

      {error && <ErrorDisplay error={error} />}

      {packageInfo && (
        <>
          <PackageDetails packageInfo={packageInfo} />

          {packageInfo.tarballUrl && (
            <>
              <CompressionAnalysis
                tarballUrl={packageInfo.tarballUrl}
                onResults={handleCompressionResults}
                onProgress={handleCompressionProgress}
                onError={(err) => console.error("Compression error:", err)}
              />

              <CompressionResults
                results={compressionResults}
                originalSize={originalSize}
                originalGzippedSize={originalGzippedSize}
                progress={compressionProgress}
              />

              {compressionResults.length > 0 && (
                <>
                  <CompressionChart
                    results={compressionResults}
                    originalGzippedSize={originalGzippedSize}
                    isUpdating={
                      compressionProgress.current < compressionProgress.total
                    }
                  />
                  
                  <BandwidthSavings
                    packageName={packageInfo.name}
                    results={compressionResults}
                    originalGzippedSize={originalGzippedSize}
                  />
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
