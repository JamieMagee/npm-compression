import { useState, useEffect } from "preact/hooks";
import type { CompressionResult } from "../types";

interface BandwidthSavingsProps {
  packageName: string;
  results: CompressionResult[];
  originalGzippedSize: number;
}

interface DownloadData {
  downloads: number;
  package: string;
  start: string;
  end: string;
}

interface SavingsCalculation {
  method: string;
  level: number;
  compressionRatio: number;
  sizeDifference: number;
  weeklyDownloads: number;
  weeklyBandwidthSaved: number;
  yearlyBandwidthSaved: number;
}

export function BandwidthSavings({ packageName, results, originalGzippedSize }: BandwidthSavingsProps) {
  const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!packageName) return;

    const fetchDownloadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://api.npmjs.org/downloads/range/last-week/${packageName}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch download data: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Sum up the downloads for the week
        const totalDownloads = data.downloads?.reduce((sum: number, day: any) => sum + day.downloads, 0) || 0;
        
        setDownloadData({
          downloads: totalDownloads,
          package: data.package,
          start: data.start,
          end: data.end
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch download data");
      } finally {
        setLoading(false);
      }
    };

    fetchDownloadData();
  }, [packageName]);

  const calculateSavings = (): SavingsCalculation[] => {
    if (!downloadData || !results.length || !originalGzippedSize) return [];

    return results
      .filter(result => result.size < originalGzippedSize) // Only show methods that actually save space
      .map(result => {
        const sizeDifference = originalGzippedSize - result.size;
        const weeklyBandwidthSaved = (sizeDifference * downloadData.downloads) / (1024 * 1024); // Convert to MB
        const yearlyBandwidthSaved = weeklyBandwidthSaved * 52; // Approximate yearly savings

        return {
          method: result.method,
          level: result.level,
          compressionRatio: result.compressionRatio,
          sizeDifference,
          weeklyDownloads: downloadData.downloads,
          weeklyBandwidthSaved,
          yearlyBandwidthSaved
        };
      })
      .sort((a, b) => b.weeklyBandwidthSaved - a.weeklyBandwidthSaved); // Sort by highest savings first
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatBandwidth = (mb: number): string => {
    if (mb < 1) return `${(mb * 1024).toFixed(1)} KB`;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    if (mb < 1024 * 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${(mb / (1024 * 1024)).toFixed(1)} TB`;
  };

  if (loading) {
    return (
      <div className="bandwidth-savings">
        <h3>📊 Bandwidth Savings Analysis</h3>
        <p>Loading download statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bandwidth-savings">
        <h3>📊 Bandwidth Savings Analysis</h3>
        <p className="error">Error: {error}</p>
      </div>
    );
  }

  if (!downloadData || !results.length) {
    return null;
  }

  const savings = calculateSavings();

  if (!savings.length) {
    return (
      <div className="bandwidth-savings">
        <h3>📊 Bandwidth Savings Analysis</h3>
        <p>No compression methods provide bandwidth savings over the original gzipped tarball.</p>
      </div>
    );
  }

  return (
    <div className="bandwidth-savings">
      <h3>📊 Bandwidth Savings Analysis</h3>
      
      <div className="download-stats">
        <p>
          <strong>{packageName}</strong> had <strong>{downloadData.downloads.toLocaleString()}</strong> downloads 
          in the past week ({new Date(downloadData.start).toLocaleDateString()} - {new Date(downloadData.end).toLocaleDateString()})
        </p>
      </div>

      <div className="savings-table">
        <table>
          <thead>
            <tr>
              <th>Compression Method</th>
              <th>Level</th>
              <th>Ratio</th>
              <th>Size Reduction</th>
              <th>Weekly Bandwidth Saved</th>
              <th>Yearly Bandwidth Saved*</th>
            </tr>
          </thead>
          <tbody>
            {savings.map((saving) => (
              <tr key={`${saving.method}-${saving.level}`}>
                <td>
                  <span className={`method-badge method-${saving.method}`}>
                    {saving.method.toUpperCase()}
                  </span>
                </td>
                <td>{saving.level}</td>
                <td>{(saving.compressionRatio).toFixed(2)}%</td>
                <td>{formatBytes(saving.sizeDifference)}</td>
                <td className="bandwidth-saved">
                  {formatBandwidth(saving.weeklyBandwidthSaved)}
                </td>
                <td className="bandwidth-saved yearly">
                  {formatBandwidth(saving.yearlyBandwidthSaved)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="savings-summary">
        <div className="best-savings">
          <h4>🏆 Best Bandwidth Savings</h4>
          <p>
            Using <strong>{savings[0].method.toUpperCase()} level {savings[0].level}</strong> could save approximately{' '}
            <strong>{formatBandwidth(savings[0].weeklyBandwidthSaved)}</strong> per week and{' '}
            <strong>{formatBandwidth(savings[0].yearlyBandwidthSaved)}</strong> per year* in bandwidth.
          </p>
        </div>
      </div>

      <p className="disclaimer">
        * Yearly estimates are based on current weekly download rates and may vary significantly.
      </p>
    </div>
  );
}
