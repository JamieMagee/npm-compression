import type { PackageInfo } from "../types";

interface PackageDetailsProps {
  packageInfo: PackageInfo;
}

export function PackageDetails({ packageInfo }: PackageDetailsProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="package-info">
      <h2>{packageInfo.name}</h2>
      <div className="version-badge">
        Latest Version: <strong>{packageInfo.version}</strong>
      </div>

      <div className="package-details">
        <div className="detail-item">
          <strong>Description:</strong>
          <p>{packageInfo.description}</p>
        </div>

        {packageInfo.author && (
          <div className="detail-item">
            <strong>Author:</strong>
            <p>{packageInfo.author}</p>
          </div>
        )}

        {packageInfo.license && (
          <div className="detail-item">
            <strong>License:</strong>
            <p>{packageInfo.license}</p>
          </div>
        )}

        <div className="detail-item">
          <strong>Last Modified:</strong>
          <p>{formatDate(packageInfo.lastModified)}</p>
        </div>

        <div className="links">
          <a
            href={`https://www.npmjs.com/package/${packageInfo.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="npm-link"
          >
            View on NPM
          </a>

          {packageInfo.homepage && (
            <a
              href={packageInfo.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="homepage-link"
            >
              Homepage
            </a>
          )}

          {packageInfo.repository?.url && (
            <a
              href={packageInfo.repository.url
                .replace("git+", "")
                .replace(".git", "")}
              target="_blank"
              rel="noopener noreferrer"
              className="repo-link"
            >
              Repository
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
