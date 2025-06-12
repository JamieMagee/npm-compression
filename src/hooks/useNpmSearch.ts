import { useState } from "preact/hooks";
import type { PackageInfo } from "../types";

export function useNpmSearch() {
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPackage = async (query: string) => {
    setLoading(true);
    setError(null);
    setPackageInfo(null);

    try {
      const response = await fetch(`https://registry.npmjs.org/${query}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Package not found");
        }
        throw new Error("Failed to fetch package information");
      }

      const data = await response.json();
      const latestVersion = data["dist-tags"]?.latest || "unknown";
      const versionData = data.versions?.[latestVersion] || {};

      setPackageInfo({
        name: data.name,
        version: latestVersion,
        description:
          versionData.description ||
          data.description ||
          "No description available",
        author:
          typeof versionData.author === "string"
            ? versionData.author
            : versionData.author?.name || data.author?.name,
        license: versionData.license || data.license,
        homepage: versionData.homepage || data.homepage,
        repository: versionData.repository || data.repository,
        lastModified:
          data.time?.[latestVersion] || data.time?.modified || "Unknown",
        tarballUrl: versionData.dist?.tarball,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return {
    packageInfo,
    loading,
    error,
    searchPackage,
  };
}
