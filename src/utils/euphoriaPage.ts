const API = {
  contributors: "https://api.euphoriadevelopment.uk/contributors",
  donators: "https://api.euphoriadevelopment.uk/donators",
  stats: "https://api.euphoriadevelopment.uk/stats/",
} as const;

const GITHUB_ORG = "EuphoriaTheme";
const GITHUB_CACHE_KEY = "blueprintGithubReposCache:v1";
const GITHUB_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const RELEASE_CACHE_KEY = "blueprintReleaseDownloadsCache:v1";
const RELEASE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type Cleanup = () => void;

type Person = {
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

type Product = {
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

type GithubRepo = {
  name?: unknown;
  html_url?: string | null;
  archived?: boolean;
  fork?: boolean;
  stargazers_count?: number;
  forks_count?: number;
};

type ReleaseState =
  | { kind: "asset"; url: string; assetName?: string; ts?: number }
  | { kind: "no_asset"; ts?: number }
  | { kind: "no_release"; ts?: number }
  | { kind: "error"; ts?: number };

type ReleaseAsset = {
  name?: unknown;
  browser_download_url?: unknown;
};

type Release = {
  draft?: unknown;
  assets?: ReleaseAsset[];
};

let currentCleanup: Cleanup | null = null;
let releaseCache: Record<string, ReleaseState> | null = null;
const releaseInFlight = new Map<string, Promise<void>>();

function safeUrl(url: unknown): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(String(url), window.location.href);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

function normalizeType(type: unknown): string {
  return String(type || "")
    .trim()
    .toLowerCase();
}

function observeReveal(
  observer: IntersectionObserver,
  elements: ArrayLike<Element>,
): void {
  Array.from(elements).forEach((el) => {
    if (!el.classList.contains("reveal-base")) {
      el.classList.add("reveal-base");
    }
    observer.observe(el);
  });
}

function setGridMessage(
  grid: HTMLElement | null,
  message: string,
  observer: IntersectionObserver,
): void {
  if (!grid) return;
  grid.innerHTML = "";
  const card = document.createElement("article");
  card.className = "data-card product-card";
  card.textContent = message;
  grid.appendChild(card);
  observeReveal(observer, [card]);
}

function createPersonCard(person: Person, typeLabel: string): HTMLElement {
  const name = person.Name ? String(person.Name) : "Unknown";
  const contribution = person.Contribution ? String(person.Contribution) : "";
  const donation = person.Donation ? String(person.Donation) : "";
  const href = safeUrl(person.Link);
  const imageUrl = safeUrl(person.Image);
  const fallbackAvatar =
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(name) +
    "&background=3b82f6&color=fff&size=96";

  const el = document.createElement(href ? "a" : "article");
  if (href && el instanceof HTMLAnchorElement) {
    el.href = href;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
  }
  el.className = "data-card person-card";

  const row = document.createElement("div");
  row.className = "person-row";

  const avatar = document.createElement("img");
  avatar.className = "avatar";
  avatar.src = imageUrl || fallbackAvatar;
  avatar.alt = name;
  avatar.loading = "lazy";
  avatar.decoding = "async";
  avatar.onerror = () => {
    avatar.onerror = null;
    avatar.src = fallbackAvatar;
  };

  const content = document.createElement("div");
  const titleRow = document.createElement("div");
  titleRow.className = "title-row";

  const title = document.createElement("h4");
  title.textContent = name;

  const pill = document.createElement("span");
  pill.className = "pill";
  pill.textContent = donation || typeLabel;

  const sub = document.createElement("p");
  sub.textContent = contribution || "Supporter of Euphoria.";
  sub.style.color = "var(--ink-70)";
  sub.style.fontSize = "0.9rem";

  titleRow.append(title, pill);
  content.append(titleRow, sub);
  row.append(avatar, content);
  el.appendChild(row);

  return el;
}

async function loadPeople(
  gridId: string,
  url: string,
  typeLabel: string,
  emptyMessage: string,
  errorMessage: string,
  observer: IntersectionObserver,
): Promise<void> {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    const data: unknown = await response.json();
    const items = Array.isArray(data) ? (data as Person[]) : [];

    grid.innerHTML = "";
    if (!items.length) {
      setGridMessage(grid, emptyMessage, observer);
      return;
    }

    items.forEach((person) => {
      grid.appendChild(createPersonCard(person, typeLabel));
    });
    observeReveal(observer, grid.children);
  } catch (error) {
    console.error(`Error fetching ${typeLabel.toLowerCase()}s:`, error);
    setGridMessage(grid, errorMessage, observer);
  }
}

function getBannerUrl(product: Product): string | null {
  const { banner } = product;
  if (!banner) return null;
  if (typeof banner === "string") return banner;
  return String(banner.lowres || banner.fullres || "") || null;
}

function getLatestVersionName(product: Product): string | null {
  const { versions } = product;
  if (!Array.isArray(versions) || !versions.length) return null;

  let best = versions[0];
  let bestTs = -Infinity;
  versions.forEach((version) => {
    const ts = Date.parse(String(version.created || ""));
    if (Number.isFinite(ts) && ts > bestTs) {
      bestTs = ts;
      best = version;
    }
  });

  if (!best.name) return null;
  return "v" + String(best.name);
}

function getBlueprintUrl(product: Product): string | null {
  if (!product.identifier) return null;
  return (
    "https://blueprint.zip/extensions/" +
    encodeURIComponent(String(product.identifier))
  );
}

function getOffer(
  platforms: Product["platforms"],
  platformKey: string,
): { price: number; currency: string; url: string | null } | null {
  const raw = platforms?.[platformKey];
  if (!raw) return null;
  const price = Number(raw.price);
  const currency = raw.currency ? String(raw.currency).toUpperCase() : "";
  const url = safeUrl(raw.url);
  return { price: Number.isFinite(price) ? price : 0, currency, url };
}

function getPriceLabel(product: Product): string {
  const { platforms } = product;
  if (!platforms) return "FREE";

  const preferred = ["BUILTBYBIT", "SOURCEXCHANGE", ...Object.keys(platforms)];
  for (const key of preferred) {
    const offer = getOffer(platforms, key);
    if (offer && offer.price > 0) {
      if (!offer.currency) return offer.price.toFixed(2);
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: offer.currency,
        }).format(offer.price);
      } catch {
        return offer.price.toFixed(2);
      }
    }
  }
  return "FREE";
}

function getRepoPathFromGithubUrl(url: unknown): string | null {
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

function attachGithubLinks(
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

function loadGithubCache(): GithubRepo[] | null {
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

function saveGithubCache(items: GithubRepo[]): void {
  try {
    localStorage.setItem(
      GITHUB_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), items }),
    );
  } catch {
    // Ignore storage failures.
  }
}

function loadReleaseCache(): Record<string, ReleaseState> {
  try {
    const raw = localStorage.getItem(RELEASE_CACHE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};
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

function hydrateProductDownloads(root: HTMLElement): void {
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

async function fetchGithubRepos(): Promise<GithubRepo[]> {
  const url = `https://api.github.com/orgs/${encodeURIComponent(
    GITHUB_ORG,
  )}/repos?per_page=100&sort=updated`;
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!response.ok)
    throw new Error(`GitHub request failed (${response.status}).`);

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

function createProductCard(product: Product): HTMLElement {
  const typeLabel = normalizeType(product.type) === "theme" ? "Theme" : "Addon";
  const name = String(product.name || "Untitled");
  const summary = String(product.summary || "No summary provided.");
  const bannerUrl = safeUrl(getBannerUrl(product));
  const blueprintUrl = safeUrl(getBlueprintUrl(product));
  const bbbUrl = safeUrl(product.platforms?.BUILTBYBIT?.url);
  const sxUrl = safeUrl(product.platforms?.SOURCEXCHANGE?.url);
  const ghUrl = safeUrl(product.githubUrl);
  const repoPath = ghUrl ? getRepoPathFromGithubUrl(ghUrl) : null;
  const versionLabel = getLatestVersionName(product);
  const panels = Number(product.stats?.panels) || 0;

  const card = document.createElement("article");
  card.className = "data-card";

  if (bannerUrl) {
    const imageWrap = document.createElement("div");
    imageWrap.className = "product-image";

    const img = document.createElement("img");
    img.src = bannerUrl;
    img.alt = name;
    img.loading = "lazy";
    img.decoding = "async";
    imageWrap.appendChild(img);

    if (versionLabel) {
      const badge = document.createElement("span");
      badge.className = "version-badge";
      badge.textContent = versionLabel;
      imageWrap.appendChild(badge);
    }

    card.appendChild(imageWrap);
  }

  const titleRow = document.createElement("div");
  titleRow.className = "title-row";

  const title = document.createElement("h4");
  title.textContent = name;

  const typePill = document.createElement("span");
  typePill.className = "pill";
  typePill.textContent = typeLabel;
  titleRow.append(title, typePill);

  const desc = document.createElement("p");
  desc.textContent = summary;
  desc.style.color = "var(--ink-70)";
  desc.style.fontSize = "0.9rem";

  const meta = document.createElement("div");
  meta.className = "meta";
  [
    getPriceLabel(product),
    panels.toLocaleString() + " panels",
    typeof product.githubStars === "number"
      ? product.githubStars.toLocaleString() + " stars"
      : null,
    typeof product.githubForks === "number"
      ? product.githubForks.toLocaleString() + " forks"
      : null,
  ].forEach((label) => {
    if (!label) return;
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = label;
    meta.appendChild(pill);
  });

  const actions = document.createElement("div");
  actions.className = "actions";
  [
    blueprintUrl ? { label: "Blueprint", href: blueprintUrl } : null,
    ghUrl ? { label: "GitHub", href: ghUrl } : null,
    repoPath ? { label: "Download", repoPath } : null,
    bbbUrl ? { label: "BuiltByBit", href: bbbUrl } : null,
    sxUrl ? { label: "SourceXchange", href: sxUrl } : null,
  ].forEach((link) => {
    if (!link) return;
    const anchor = document.createElement("a");
    anchor.className = "data-link";
    if ("href" in link && link.href) {
      anchor.href = link.href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }
    if ("repoPath" in link && link.repoPath) {
      anchor.dataset.downloadRepo = link.repoPath;
      anchor.classList.add("is-disabled");
      anchor.setAttribute("aria-disabled", "true");
    }
    anchor.textContent = link.label;
    actions.appendChild(anchor);
  });

  card.append(titleRow, desc, meta);
  if (actions.children.length) card.appendChild(actions);
  return card;
}

async function loadProducts(observer: IntersectionObserver): Promise<void> {
  const addonsGrid = document.getElementById("blueprint-addons-grid");
  const themesGrid = document.getElementById("blueprint-themes-grid");
  const addonCount = document.getElementById("blueprint-addon-count");
  const themeCount = document.getElementById("blueprint-theme-count");
  if (!addonsGrid && !themesGrid) return;

  try {
    const cachedRepos = loadGithubCache();
    const [productsRes, reposRes] = await Promise.allSettled([
      fetch(API.stats, { headers: { Accept: "application/json" } }),
      fetchGithubRepos(),
    ]);

    if (reposRes.status === "fulfilled") saveGithubCache(reposRes.value);
    const reposForLinks =
      reposRes.status === "fulfilled" ? reposRes.value : cachedRepos;
    if (productsRes.status !== "fulfilled" || !productsRes.value.ok) {
      throw new Error("Product request failed.");
    }

    const data: unknown = await productsRes.value.json();
    const rawItems =
      data && typeof data === "object" && "blueprintExtensions" in data
        ? data.blueprintExtensions
        : null;
    const items = attachGithubLinks(
      Array.isArray(rawItems) ? (rawItems as Product[]) : [],
      reposForLinks,
    );
    const themes = items.filter(
      (product) => normalizeType(product.type) === "theme",
    );
    const addons = items.filter(
      (product) => normalizeType(product.type) !== "theme",
    );

    if (addonCount) addonCount.textContent = String(addons.length);
    if (themeCount) themeCount.textContent = String(themes.length);

    if (addonsGrid) {
      addonsGrid.innerHTML = "";
      if (!addons.length)
        setGridMessage(addonsGrid, "No addons found yet.", observer);
      addons.forEach((product) =>
        addonsGrid.appendChild(createProductCard(product)),
      );
      hydrateProductDownloads(addonsGrid);
      observeReveal(observer, addonsGrid.children);
    }

    if (themesGrid) {
      themesGrid.innerHTML = "";
      if (!themes.length)
        setGridMessage(themesGrid, "No themes found yet.", observer);
      themes.forEach((product) =>
        themesGrid.appendChild(createProductCard(product)),
      );
      hydrateProductDownloads(themesGrid);
      observeReveal(observer, themesGrid.children);
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    setGridMessage(addonsGrid, "Unable to load addons at this time.", observer);
    setGridMessage(themesGrid, "Unable to load themes at this time.", observer);
    if (addonCount) addonCount.textContent = "0";
    if (themeCount) themeCount.textContent = "0";
  }
}

function initCarouselControls(): Cleanup {
  const cleanups: Cleanup[] = [];
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".carousel-btn"),
  );

  buttons.forEach((button) => {
    const onClick = () => {
      const key = button.dataset.carousel;
      const direction = button.dataset.direction;
      const track = document.querySelector<HTMLElement>(
        `[data-carousel-track="${key}"]`,
      );
      if (!track) return;

      const card = track.querySelector<HTMLElement>(".data-card");
      const amount = (card?.getBoundingClientRect().width || 260) + 16;
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);

      if (
        direction === "next" &&
        track.scrollLeft >= maxScroll - amount * 0.5
      ) {
        track.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      if (direction === "prev" && track.scrollLeft <= amount * 0.5) {
        track.scrollTo({ left: maxScroll, behavior: "smooth" });
        return;
      }

      track.scrollBy({
        left: direction === "next" ? amount : -amount,
        behavior: "smooth",
      });
    };

    button.addEventListener("click", onClick);
    cleanups.push(() => button.removeEventListener("click", onClick));
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

function initGalleryModal(): Cleanup {
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById(
    "image-modal-img",
  ) as HTMLImageElement | null;
  const modalCaption = document.getElementById("image-modal-caption");
  if (!modal || !modalImg || !modalCaption) return () => undefined;

  const cleanups: Cleanup[] = [];
  const openModal = (src: string, alt: string) => {
    modalImg.src = src;
    modalImg.alt = alt;
    modalCaption.textContent = alt;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modalImg.src = "";
    document.body.style.overflow = "";
  };

  document
    .querySelectorAll<HTMLImageElement>(".gallery-item")
    .forEach((img) => {
      const onClick = () => openModal(img.currentSrc || img.src, img.alt);
      img.addEventListener("click", onClick);
      cleanups.push(() => img.removeEventListener("click", onClick));
    });

  modal.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
    cleanups.push(() => el.removeEventListener("click", closeModal));
  });

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && modal.classList.contains("is-open"))
      closeModal();
  };
  document.addEventListener("keydown", onKeyDown);
  cleanups.push(() => document.removeEventListener("keydown", onKeyDown));

  return () => {
    closeModal();
    cleanups.forEach((cleanup) => cleanup());
  };
}

export function initEuphoriaPage(): Cleanup {
  currentCleanup?.();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.2 },
  );

  observeReveal(
    observer,
    document.querySelectorAll(
      "section, .hero-media img, .feature-grid article",
    ),
  );
  void loadPeople(
    "contributors-grid",
    API.contributors,
    "Contributor",
    "No contributors found yet.",
    "Unable to load contributors at this time.",
    observer,
  );
  void loadPeople(
    "donators-grid",
    API.donators,
    "Supporter",
    "No donators found yet.",
    "Unable to load donators at this time.",
    observer,
  );
  void loadProducts(observer);

  const cleanupCarousel = initCarouselControls();
  const cleanupGallery = initGalleryModal();
  currentCleanup = () => {
    observer.disconnect();
    cleanupCarousel();
    cleanupGallery();
    currentCleanup = null;
  };

  return currentCleanup;
}
