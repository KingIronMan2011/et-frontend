import { RELEASE_CACHE_KEY, RELEASE_CACHE_TTL_MS } from "./constants";
import type { Release, ReleaseAsset, ReleaseState } from "./types";

let releaseCache: Record<string, ReleaseState> | null = null;
const releaseInFlight = new Map<string, Promise<void>>();

function loadReleaseCache(): Record<string, ReleaseState> {
  try {
    const raw = localStorage.getItem(RELEASE_CACHE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, ReleaseState>;
  } catch {
    return {};
  }
}

function saveReleaseCache(cache: Record<string, ReleaseState>): void {
  try {
    localStorage.setItem(RELEASE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage failures.
  }
}

function getReleaseCache(): Record<string, ReleaseState> {
  releaseCache ||= loadReleaseCache();
  return releaseCache;
}

function getCachedRelease(repoPath: string): ReleaseState | null {
  const entry = getReleaseCache()[repoPath];
  if (!entry?.ts || Date.now() - entry.ts > RELEASE_CACHE_TTL_MS) return null;
  return entry;
}

function setCachedRelease(repoPath: string, data: ReleaseState): void {
  const cache = getReleaseCache();
  cache[repoPath] = { ...data, ts: Date.now() };
  saveReleaseCache(cache);
}

function pickBestAsset(assets: unknown): ReleaseAsset | null {
  const list = Array.isArray(assets) ? (assets as ReleaseAsset[]) : [];
  const zip = list.find((asset) =>
    String(asset.name || "")
      .toLowerCase()
      .endsWith(".zip"),
  );
  if (zip?.browser_download_url) return zip;
  const jar = list.find((asset) =>
    String(asset.name || "")
      .toLowerCase()
      .endsWith(".jar"),
  );
  if (jar?.browser_download_url) return jar;
  return list.find((asset) => Boolean(asset.browser_download_url)) || null;
}

async function fetchJson(
  url: string,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok) return { ok: false, status: response.status, json: null };
  try {
    return { ok: true, status: response.status, json: await response.json() };
  } catch {
    return { ok: false, status: response.status, json: null };
  }
}

async function fetchLatestReleaseDownload(
  repoPath: string,
): Promise<ReleaseState> {
  const latest = await fetchJson(
    `https://api.github.com/repos/${repoPath}/releases/latest`,
  );
  if (latest.ok) {
    const best = pickBestAsset((latest.json as Release | null)?.assets);
    if (best?.browser_download_url) {
      return {
        kind: "asset",
        url: String(best.browser_download_url),
        assetName: best.name ? String(best.name) : "",
      };
    }
    return { kind: "no_asset" };
  }

  if (latest.status === 404) {
    const list = await fetchJson(
      `https://api.github.com/repos/${repoPath}/releases?per_page=10`,
    );
    if (!list.ok) return { kind: "no_release" };
    const releases = Array.isArray(list.json) ? (list.json as Release[]) : [];
    const firstPublished = releases.find((release) => !release.draft);
    if (!firstPublished) return { kind: "no_release" };
    const best = pickBestAsset(firstPublished.assets);
    if (best?.browser_download_url) {
      return {
        kind: "asset",
        url: String(best.browser_download_url),
        assetName: best.name ? String(best.name) : "",
      };
    }
    return { kind: "no_asset" };
  }

  return { kind: "error" };
}

function applyDownloadState(
  button: HTMLAnchorElement,
  state: ReleaseState | null,
): void {
  if (state?.kind === "asset") {
    button.textContent = "Download";
    button.href = state.url;
    button.target = "_blank";
    button.rel = "noopener noreferrer";
    button.classList.remove("is-disabled");
    button.setAttribute("aria-disabled", "false");
    if (state.assetName) button.title = "Download " + state.assetName;
    return;
  }

  button.textContent =
    state?.kind === "no_release"
      ? "No Release"
      : state?.kind === "no_asset"
        ? "No Download"
        : state?.kind === "error"
          ? "Unavailable"
          : "Download";
  button.classList.add("is-disabled");
  button.setAttribute("aria-disabled", "true");
  button.removeAttribute("href");
}

export function hydrateProductDownloads(root: HTMLElement): void {
  const buttons = Array.from(
    root.querySelectorAll<HTMLAnchorElement>("a[data-download-repo]"),
  );

  buttons.forEach((button) => {
    const repoPath = button.getAttribute("data-download-repo");
    if (!repoPath) return;

    const cached = getCachedRelease(repoPath);
    if (cached) {
      applyDownloadState(button, cached);
      return;
    }

    if (releaseInFlight.has(repoPath)) return;
    const request = fetchLatestReleaseDownload(repoPath)
      .then((state) => {
        setCachedRelease(repoPath, state);
        applyDownloadState(button, state);
      })
      .catch(() => {
        const state: ReleaseState = { kind: "error" };
        setCachedRelease(repoPath, state);
        applyDownloadState(button, state);
      })
      .finally(() => {
        releaseInFlight.delete(repoPath);
      });

    releaseInFlight.set(repoPath, request);
  });
}
