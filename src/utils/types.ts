export type Cleanup = () => void;

export type Person = {
  Name?: unknown;
  Contribution?: unknown;
  Donation?: unknown;
  Link?: unknown;
  Image?: unknown;
};

type ProductBanner =
  | string
  | {
      lowres?: unknown;
      fullres?: unknown;
    };

type ProductPlatform = {
  price?: unknown;
  currency?: unknown;
  url?: unknown;
};

export type Product = {
  name?: unknown;
  summary?: unknown;
  identifier?: unknown;
  type?: unknown;
  banner?: ProductBanner;
  platforms?: Record<string, ProductPlatform | undefined>;
  versions?: Array<{ created?: unknown; name?: unknown }>;
  stats?: { panels?: unknown };
  githubUrl?: string | null;
  githubStars?: number | null;
  githubForks?: number | null;
};

export type GithubRepo = {
  name?: unknown;
  html_url?: string | null;
  archived?: boolean;
  fork?: boolean;
  stargazers_count?: number;
  forks_count?: number;
};

export type ReleaseState =
  | { kind: "asset"; url: string; assetName?: string; ts?: number }
  | { kind: "no_asset"; ts?: number }
  | { kind: "no_release"; ts?: number }
  | { kind: "error"; ts?: number };

export type ReleaseAsset = {
  name?: unknown;
  browser_download_url?: unknown;
};

export type Release = {
  draft?: unknown;
  assets?: ReleaseAsset[];
};
