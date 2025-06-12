import { useState, useEffect } from "preact/hooks";
import type { CompressionResult } from "../types";

interface CompressionResultsProps {
  results: CompressionResult[];
  originalSize: number;
  originalGzippedSize: number;
  progress?: {
    current: number;
    total: number;
    currentMethod?: string;
    currentLevel?: number;
  };
}

export function CompressionResults({
  results,
  originalSize,
  originalGzippedSize,
  progress,
}: CompressionResultsProps) {
  const [previousResultsLength, setPreviousResultsLength] = useState(0);

  // Track when new results are added
  useEffect(() => {
    setPreviousResultsLength(results.length);
  }, [results.length]);
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (results.length === 0 && (!progress || progress.total === 0)) return null;

  return (
    <>
      {originalSize > 0 && (
        <div className="size-info">
          <div className="original-size">
            <strong>Original npm tarball (.tgz):</strong>{" "}
            {formatBytes(originalGzippedSize)}
          </div>
          <div className="original-size">
            <strong>Uncompressed tar archive:</strong>{" "}
            {formatBytes(originalSize)}
          </div>
          <div className="original-size">
            <strong>Original compression ratio:</strong>{" "}
            {((1 - originalGzippedSize / originalSize) * 100).toFixed(2)}%
          </div>
        </div>
      )}

      {progress && progress.total > 0 && (
        <div className="compression-progress">
          <div className="progress-info">
            <div className="progress-text">
              <strong>Compression Progress:</strong> {progress.current} of{" "}
              {progress.total} completed
              {progress.currentMethod && progress.currentLevel && (
                <span className="current-task">
                  {progress.current < progress.total && (
                    <>
                      {" "}
                      • Currently processing:{" "}
                      <span className={`method-${progress.currentMethod}`}>
                        {progress.currentMethod} level {progress.currentLevel}
                      </span>
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                }}
              ></div>
            </div>
            <div className="progress-percentage">
              {Math.round((progress.current / progress.total) * 100)}%
            </div>
          </div>
        </div>
      )}

      <div className="compression-results">
        <table className="results-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Level</th>
              <th>Compressed Size</th>
              <th>Compression Ratio</th>
              <th>Time (ms)</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => {
              // Check if this is a newly added result (last one and progress is still ongoing)
              const isNewResult =
                progress &&
                progress.current < progress.total &&
                index === results.length - 1 &&
                results.length > previousResultsLength;

              return (
                <tr
                  key={`${result.method}-${result.level}`}
                  className={isNewResult ? "new-result" : ""}
                >
                  <td className={`method-${result.method}`}>{result.method}</td>
                  <td>{result.level}</td>
                  <td>{formatBytes(result.size)}</td>
                  <td>{result.compressionRatio.toFixed(2)}%</td>
                  <td>{result.timeTaken.toFixed(2)}</td>
                </tr>
              );
            })}

            {/* Show placeholder rows for remaining work */}
            {progress &&
              progress.current < progress.total &&
              Array.from({ length: progress.total - progress.current }).map(
                (_, index) => (
                  <tr key={`placeholder-${index}`} className="placeholder-row">
                    <td colSpan={5} className="placeholder-cell">
                      <div className="placeholder-content">
                        <div className="placeholder-spinner"></div>
                        <span>Processing...</span>
                      </div>
                    </td>
                  </tr>
                ),
              )}
          </tbody>
        </table>
      </div>
    </>
  );
}
