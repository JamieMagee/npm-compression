export interface PackageInfo {
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: {
    url: string;
  };
  lastModified: string;
  tarballUrl?: string;
}

export interface CompressionResult {
  level: number;
  size: number;
  compressionRatio: number;
  timeTaken: number;
  method: "gzip" | "brotli" | "zstd";
}
