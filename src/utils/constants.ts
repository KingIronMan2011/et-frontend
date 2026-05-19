export const API = {
  contributors: "https://api.euphoriadevelopment.uk/contributors",
  donators: "https://api.euphoriadevelopment.uk/donators",
  stats: "https://api.euphoriadevelopment.uk/stats/",
} as const;

export const GITHUB_ORG = "EuphoriaTheme";
export const GITHUB_CACHE_KEY = "blueprintGithubReposCache:v1";
export const GITHUB_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
export const RELEASE_CACHE_KEY = "blueprintReleaseDownloadsCache:v1";
export const RELEASE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
