import { GITHUB_CACHE_KEY, GITHUB_CACHE_TTL_MS, GITHUB_ORG } from "./constants";
import { normalizeType, safeUrl } from "./dom";
import type { GithubRepo, Product } from "./types";

function normalizeRepoKey(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractRepoKeyFromGithubUrl(url: unknown): string | null {
  const href = safeUrl(url);
  if (!href) return null;

  try {
    const parsed = new URL(href);
    if (parsed.hostname !== "github.com") return null;
    const [owner = "", repo = ""] = parsed.pathname.split("/").filter(Boolean);
    if (!owner || !repo || owner.toLowerCase() !== GITHUB_ORG.toLowerCase()) {
      return null;
    }
    return normalizeRepoKey(repo);
  } catch {
    return null;
  }
}

function repoCandidatesForProduct(product: Product): string[] {
  const candidates: string[] = [];
  const name = product.name ? String(product.name) : "";
  const identifier = product.identifier ? String(product.identifier) : "";
  const type = normalizeType(product.type);

  if (name) {
    candidates.push(normalizeRepoKey(name));
    if (type === "theme") {
      candidates.push(normalizeRepoKey(name + "-Theme"));
      candidates.push(normalizeRepoKey(name + " Theme"));
    }
  }
  if (identifier) candidates.push(normalizeRepoKey(identifier));

  return Array.from(new Set(candidates)).filter(Boolean);
}

function buildRepoIndex(repos: GithubRepo[] | null): Map<string, GithubRepo> {
  const map = new Map<string, GithubRepo>();
  (repos || []).forEach((repo) => {
    if (repo.archived || repo.fork) return;
    const key = normalizeRepoKey(repo.name);
    if (!key || !repo.html_url) return;
    map.set(key, repo);
  });
  return map;
}

function inferGithubRepo(
  product: Product,
  repoIndex: Map<string, GithubRepo>,
): GithubRepo | null {
  for (const key of repoCandidatesForProduct(product)) {
    const repo = repoIndex.get(key);
    if (repo?.html_url) return repo;
  }
  return null;
}

export function getRepoPathFromGithubUrl(url: unknown): string | null {
  const href = safeUrl(url);
  if (!href) return null;

  try {
    const parsed = new URL(href);
    if (parsed.hostname !== "github.com") return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return parts[0] + "/" + parts[1];
  } catch {
    return null;
  }
}

export function attachGithubLinks(
  products: Product[],
  repos: GithubRepo[] | null,
): Product[] {
  const repoIndex = buildRepoIndex(repos);

  return products.map((product) => {
    const explicit = safeUrl(product.platforms?.GITHUB?.url);
    let repo: GithubRepo | null = null;
    if (explicit) {
      const keyFromUrl = extractRepoKeyFromGithubUrl(explicit);
      if (keyFromUrl) repo = repoIndex.get(keyFromUrl) || null;
    }
    if (!repo) repo = inferGithubRepo(product, repoIndex);

    return {
      ...product,
      githubUrl: explicit || repo?.html_url || null,
      githubStars:
        typeof repo?.stargazers_count === "number"
          ? repo.stargazers_count
          : null,
      githubForks:
        typeof repo?.forks_count === "number" ? repo.forks_count : null,
    };
  });
}

export function loadGithubCache(): GithubRepo[] | null {
  try {
    const raw = localStorage.getItem(GITHUB_CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("ts" in parsed) ||
      !("items" in parsed) ||
      !Array.isArray(parsed.items) ||
      Date.now() - Number(parsed.ts) > GITHUB_CACHE_TTL_MS
    ) {
      return null;
    }
    return parsed.items as GithubRepo[];
  } catch {
    return null;
  }
}

export function saveGithubCache(items: GithubRepo[]): void {
  try {
    localStorage.setItem(
      GITHUB_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), items }),
    );
  } catch {
    // Ignore storage failures.
  }
}

export async function fetchGithubRepos(): Promise<GithubRepo[]> {
  const url = `https://api.github.com/orgs/${encodeURIComponent(
    GITHUB_ORG,
  )}/repos?per_page=100&sort=updated`;
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status}).`);
  }

  const repos: unknown = await response.json();
  const list = Array.isArray(repos) ? (repos as GithubRepo[]) : [];
  return list.map((repo) => ({
    name: repo.name,
    html_url: repo.html_url,
    archived: Boolean(repo.archived),
    fork: Boolean(repo.fork),
    stargazers_count:
      typeof repo.stargazers_count === "number" ? repo.stargazers_count : 0,
    forks_count: typeof repo.forks_count === "number" ? repo.forks_count : 0,
  }));
}
