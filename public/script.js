const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

function observeReveal(elements) {
  elements.forEach((el) => {
    if (!el) return;
    if (!el.classList.contains("reveal-base")) el.classList.add("reveal-base");
    observer.observe(el);
  });
}

const API = {
  contributors: "https://api.euphoriadevelopment.uk/contributors",
  donators: "https://api.euphoriadevelopment.uk/donators",
  stats: "https://api.euphoriadevelopment.uk/stats/",
};

const GITHUB_ORG = "EuphoriaTheme";
const GITHUB_CACHE_KEY = "blueprintGithubReposCache:v1";
const GITHUB_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const RELEASE_CACHE_KEY = "blueprintReleaseDownloadsCache:v1";
const RELEASE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function escapeHtml(input) {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(String(url), window.location.href);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function setGridMessage(grid, message) {
  if (!grid) return;
  grid.innerHTML = "";
  const card = document.createElement("article");
  card.className = "data-card product-card";
  card.textContent = message;
  grid.appendChild(card);
  observeReveal([card]);
}

function createPersonCard(person, typeLabel) {
  const name = person && person.Name ? String(person.Name) : "Unknown";
  const contribution = person && person.Contribution ? String(person.Contribution) : "";
  const donation = person && person.Donation ? String(person.Donation) : "";
  const href = safeUrl(person && person.Link);
  const imageUrl = safeUrl(person && person.Image);
  const fallbackAvatar =
    "https://ui-avatars.com/api/?name=" + encodeURIComponent(name) + "&background=3b82f6&color=fff&size=96";

  const el = document.createElement(href ? "a" : "article");
  if (href) {
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

  titleRow.appendChild(title);
  titleRow.appendChild(pill);

  const sub = document.createElement("p");
  sub.textContent = contribution || "Supporter of Euphoria.";
  sub.style.color = "var(--ink-70)";
  sub.style.fontSize = "0.9rem";

  content.appendChild(titleRow);
  content.appendChild(sub);

  row.appendChild(avatar);
  row.appendChild(content);
  el.appendChild(row);

  return el;
}

async function loadContributors() {
  const grid = document.getElementById("contributors-grid");
  if (!grid) return;

  try {
    const response = await fetch(API.contributors, { headers: { Accept: "application/json" } });
    const contributors = await response.json();
    const items = Array.isArray(contributors) ? contributors : [];

    grid.innerHTML = "";
    if (!items.length) {
      setGridMessage(grid, "No contributors found yet.");
      return;
    }

    items.forEach((contributor) => {
      grid.appendChild(createPersonCard(contributor, "Contributor"));
    });
    observeReveal(Array.from(grid.children));
  } catch (error) {
    console.error("Error fetching contributors:", error);
    setGridMessage(grid, "Unable to load contributors at this time.");
  }
}

async function loadDonators() {
  const grid = document.getElementById("donators-grid");
  if (!grid) return;

  try {
    const response = await fetch(API.donators, { headers: { Accept: "application/json" } });
    const donators = await response.json();
    const items = Array.isArray(donators) ? donators : [];

    grid.innerHTML = "";
    if (!items.length) {
      setGridMessage(grid, "No donators found yet.");
      return;
    }

    items.forEach((donator) => {
      grid.appendChild(createPersonCard(donator, "Supporter"));
    });
    observeReveal(Array.from(grid.children));
  } catch (error) {
    console.error("Error fetching donators:", error);
    setGridMessage(grid, "Unable to load donators at this time.");
  }
}

function normalizeType(type) {
  return String(type || "").trim().toLowerCase();
}

function getBannerUrl(product) {
  const banner = product && product.banner;
  if (!banner) return null;
  if (typeof banner === "string") return banner;
  if (typeof banner === "object") return banner.lowres || banner.fullres || null;
  return null;
}

function getLatestVersionName(product) {
  const versions = product && product.versions;
  if (!Array.isArray(versions) || !versions.length) return null;

  let best = null;
  let bestTs = -Infinity;
  versions.forEach((v) => {
    const ts = Date.parse(v && v.created ? v.created : "");
    if (!Number.isFinite(ts)) return;
    if (ts > bestTs) {
      bestTs = ts;
      best = v;
    }
  });

  const picked = best || versions[0];
  if (!picked || !picked.name) return null;
  return "v" + String(picked.name);
}

function getBlueprintUrl(product) {
  const identifier = product && product.identifier;
  if (!identifier) return null;
  return "https://blueprint.zip/extensions/" + encodeURIComponent(identifier);
}

function getOffer(platforms, platformKey) {
  if (!platforms || typeof platforms !== "object") return null;
  const raw = platforms[platformKey];
  if (!raw || typeof raw !== "object") return null;
  const price = Number(raw.price);
  const currency = raw.currency ? String(raw.currency).toUpperCase() : "";
  const url = safeUrl(raw.url);
  return { price: Number.isFinite(price) ? price : 0, currency, url };
}

function getPriceLabel(product) {
  const platforms = product && product.platforms;
  if (!platforms || typeof platforms !== "object") return "FREE";

  const keys = Object.keys(platforms);
  const preferred = ["BUILTBYBIT", "SOURCEXCHANGE", ...keys];
  for (let i = 0; i < preferred.length; i += 1) {
    const offer = getOffer(platforms, preferred[i]);
    if (offer && offer.price > 0) {
      if (offer.currency) {
        try {
          return new Intl.NumberFormat(undefined, { style: "currency", currency: offer.currency }).format(offer.price);
        } catch {
          return offer.price.toFixed(2);
        }
      }
      return offer.price.toFixed(2);
    }
  }
  return "FREE";
}

function getRepoPathFromGithubUrl(url) {
  const href = safeUrl(url);
  if (!href) return null;
  try {
    const u = new URL(href);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return parts[0] + "/" + parts[1];
  } catch {
    return null;
  }
}

function normalizeRepoKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractRepoKeyFromGithubUrl(url) {
  const href = safeUrl(url);
  if (!href) return null;
  try {
    const u = new URL(href);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const owner = parts[0] || "";
    const repo = parts[1] || "";
    if (!owner || !repo) return null;
    if (owner.toLowerCase() !== GITHUB_ORG.toLowerCase()) return null;
    return normalizeRepoKey(repo);
  } catch {
    return null;
  }
}

function repoCandidatesForProduct(product) {
  const candidates = [];
  const name = product && product.name ? String(product.name) : "";
  const identifier = product && product.identifier ? String(product.identifier) : "";
  const type = normalizeType(product && product.type);

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

function buildRepoIndex(repos) {
  const list = Array.isArray(repos) ? repos : [];
  const map = new Map();
  list.forEach((repo) => {
    if (!repo || repo.archived || repo.fork) return;
    const key = normalizeRepoKey(repo.name);
    if (!key || !repo.html_url) return;
    map.set(key, repo);
  });
  return map;
}

function inferGithubRepo(product, repoIndex) {
  if (!repoIndex || typeof repoIndex.get !== "function") return null;
  const keys = repoCandidatesForProduct(product);
  for (let i = 0; i < keys.length; i += 1) {
    const repo = repoIndex.get(keys[i]);
    if (repo && repo.html_url) return repo;
  }
  return null;
}

function attachGithubLinks(products, repos) {
  const list = Array.isArray(products) ? products : [];
  const repoIndex = buildRepoIndex(repos);

  return list.map((p) => {
    const explicit =
      p &&
      p.platforms &&
      p.platforms.GITHUB &&
      p.platforms.GITHUB.url &&
      safeUrl(p.platforms.GITHUB.url);

    let repo = null;
    if (explicit) {
      const keyFromUrl = extractRepoKeyFromGithubUrl(explicit);
      if (keyFromUrl) repo = repoIndex.get(keyFromUrl) || null;
    }
    if (!repo) repo = inferGithubRepo(p, repoIndex);

    const inferredUrl = (repo && repo.html_url) || null;
    const githubUrl = explicit || inferredUrl || null;
    const stars = repo && typeof repo.stargazers_count === "number" ? repo.stargazers_count : null;
    const forks = repo && typeof repo.forks_count === "number" ? repo.forks_count : null;

    return {
      ...(p || {}),
      githubUrl,
      githubStars: stars,
      githubForks: forks,
    };
  });
}

function loadGithubCache() {
  try {
    const raw = localStorage.getItem(GITHUB_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.ts || !Array.isArray(parsed.items)) return null;
    if (Date.now() - parsed.ts > GITHUB_CACHE_TTL_MS) return null;
    return parsed.items;
  } catch {
    return null;
  }
}

function saveGithubCache(items) {
  try {
    localStorage.setItem(GITHUB_CACHE_KEY, JSON.stringify({ ts: Date.now(), items }));
  } catch {
    // ignore storage failures
  }
}

function loadReleaseCache() {
  try {
    const raw = localStorage.getItem(RELEASE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveReleaseCache(cache) {
  try {
    localStorage.setItem(RELEASE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage failures
  }
}

const releaseCache = loadReleaseCache();
const releaseInFlight = new Map();

function getCachedRelease(repoPath) {
  const entry = releaseCache && repoPath ? releaseCache[repoPath] : null;
  if (!entry || typeof entry !== "object") return null;
  if (!entry.ts) return null;
  if (Date.now() - entry.ts > RELEASE_CACHE_TTL_MS) return null;
  return entry;
}

function setCachedRelease(repoPath, data) {
  if (!repoPath) return;
  releaseCache[repoPath] = { ts: Date.now(), ...(data || {}) };
  saveReleaseCache(releaseCache);
}

function pickBestAsset(assets) {
  const list = Array.isArray(assets) ? assets : [];
  const zip = list.find(
    (a) => a && a.browser_download_url && String(a.name || "").toLowerCase().endsWith(".zip"),
  );
  if (zip) return zip;
  const jar = list.find(
    (a) => a && a.browser_download_url && String(a.name || "").toLowerCase().endsWith(".jar"),
  );
  if (jar) return jar;
  return list.find((a) => a && a.browser_download_url) || null;
}

async function fetchLatestReleaseDownload(repoPath) {
  async function fetchJson(url) {
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) return { ok: false, status: res.status, json: null };
    try {
      return { ok: true, status: res.status, json: await res.json() };
    } catch {
      return { ok: false, status: res.status, json: null };
    }
  }

  const latest = await fetchJson("https://api.github.com/repos/" + repoPath + "/releases/latest");
  if (latest.ok) {
    const best = pickBestAsset(latest.json && latest.json.assets);
    if (best && best.browser_download_url) {
      return { kind: "asset", url: best.browser_download_url, assetName: best.name || "" };
    }
    return { kind: "no_asset" };
  }

  if (latest.status === 404) {
    const list = await fetchJson("https://api.github.com/repos/" + repoPath + "/releases?per_page=10");
    if (!list.ok) return { kind: "no_release" };
    const releases = Array.isArray(list.json) ? list.json : [];
    const firstPublished = releases.find((r) => r && !r.draft);
    if (!firstPublished) return { kind: "no_release" };
    const best = pickBestAsset(firstPublished.assets);
    if (best && best.browser_download_url) {
      return { kind: "asset", url: best.browser_download_url, assetName: best.name || "" };
    }
    return { kind: "no_asset" };
  }

  return { kind: "error" };
}

function applyDownloadState(button, state) {
  if (!button) return;
  if (!state || typeof state !== "object") {
    button.textContent = "Download";
    button.classList.add("is-disabled");
    button.setAttribute("aria-disabled", "true");
    button.removeAttribute("href");
    return;
  }

  if (state.kind === "asset" && state.url) {
    button.textContent = "Download";
    button.href = state.url;
    button.target = "_blank";
    button.rel = "noopener noreferrer";
    button.classList.remove("is-disabled");
    button.setAttribute("aria-disabled", "false");
    if (state.assetName) button.title = "Download " + state.assetName;
    return;
  }

  if (state.kind === "no_release") {
    button.textContent = "No Release";
  } else if (state.kind === "no_asset") {
    button.textContent = "No Download";
  } else {
    button.textContent = "Unavailable";
  }
  button.classList.add("is-disabled");
  button.setAttribute("aria-disabled", "true");
  button.removeAttribute("href");
}

function hydrateProductDownloads(root) {
  const buttons = Array.from(root.querySelectorAll("a[data-download-repo]"));
  if (!buttons.length) return;

  buttons.forEach((button) => {
    const repoPath = button.getAttribute("data-download-repo");
    if (!repoPath) return;

    const cached = getCachedRelease(repoPath);
    if (cached) {
      applyDownloadState(button, cached);
      return;
    }

    if (releaseInFlight.has(repoPath)) return;
    const p = fetchLatestReleaseDownload(repoPath)
      .then((state) => {
        const normalized = state && typeof state === "object" ? state : { kind: "error" };
        setCachedRelease(repoPath, normalized);
        applyDownloadState(button, normalized);
      })
      .catch(() => {
        const normalized = { kind: "error" };
        setCachedRelease(repoPath, normalized);
        applyDownloadState(button, normalized);
      })
      .finally(() => {
        releaseInFlight.delete(repoPath);
      });

    releaseInFlight.set(repoPath, p);
  });
}

async function fetchGithubRepos() {
  const url =
    "https://api.github.com/orgs/" + encodeURIComponent(GITHUB_ORG) + "/repos?per_page=100&sort=updated";
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) throw new Error("GitHub request failed (" + res.status + ").");

  const repos = await res.json();
  const list = Array.isArray(repos) ? repos : [];
  return list.map((repo) => ({
    name: repo && repo.name,
    html_url: repo && repo.html_url,
    archived: Boolean(repo && repo.archived),
    fork: Boolean(repo && repo.fork),
    stargazers_count:
      typeof (repo && repo.stargazers_count) === "number" ? repo.stargazers_count : 0,
    forks_count: typeof (repo && repo.forks_count) === "number" ? repo.forks_count : 0,
  }));
}

function createProductCard(product) {
  const type = normalizeType(product && product.type);
  const typeLabel = type === "theme" ? "Theme" : "Addon";
  const name = String((product && product.name) || "Untitled");
  const summary = String((product && product.summary) || "No summary provided.");
  const bannerUrl = safeUrl(getBannerUrl(product));
  const blueprintUrl = safeUrl(getBlueprintUrl(product));
  const bbbUrl = safeUrl(product && product.platforms && product.platforms.BUILTBYBIT && product.platforms.BUILTBYBIT.url);
  const sxUrl = safeUrl(product && product.platforms && product.platforms.SOURCEXCHANGE && product.platforms.SOURCEXCHANGE.url);
  const ghUrl = safeUrl(product && product.githubUrl);
  const repoPath = ghUrl ? getRepoPathFromGithubUrl(ghUrl) : null;
  const versionLabel = getLatestVersionName(product);
  const ghStars =
    product && typeof product.githubStars === "number" ? product.githubStars.toLocaleString() : null;
  const ghForks =
    product && typeof product.githubForks === "number" ? product.githubForks.toLocaleString() : null;
  const priceLabel = getPriceLabel(product);
  const panels = Number(product && product.stats && product.stats.panels) || 0;

  const card = document.createElement("article");
  card.className = "data-card";

  const titleRow = document.createElement("div");
  titleRow.className = "title-row";

  const title = document.createElement("h4");
  title.textContent = name;

  const pill = document.createElement("span");
  pill.className = "pill";
  pill.textContent = typeLabel;

  titleRow.appendChild(title);
  titleRow.appendChild(pill);

  const desc = document.createElement("p");
  desc.textContent = summary;
  desc.style.color = "var(--ink-70)";
  desc.style.fontSize = "0.9rem";

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

  const meta = document.createElement("div");
  meta.className = "meta";
  const price = document.createElement("span");
  price.className = "pill";
  price.textContent = priceLabel;
  const panelsSpan = document.createElement("span");
  panelsSpan.className = "pill";
  panelsSpan.textContent = panels.toLocaleString() + " panels";
  meta.appendChild(price);
  meta.appendChild(panelsSpan);
  if (ghStars) {
    const stars = document.createElement("span");
    stars.className = "pill";
    stars.textContent = ghStars + " stars";
    meta.appendChild(stars);
  }
  if (ghForks) {
    const forks = document.createElement("span");
    forks.className = "pill";
    forks.textContent = ghForks + " forks";
    meta.appendChild(forks);
  }

  const actions = document.createElement("div");
  actions.className = "actions";

  const links = [
    blueprintUrl ? { label: "Blueprint", href: blueprintUrl } : null,
    ghUrl ? { label: "GitHub", href: ghUrl } : null,
    repoPath ? { label: "Download", href: null, repoPath } : null,
    bbbUrl ? { label: "BuiltByBit", href: bbbUrl } : null,
    sxUrl ? { label: "SourceXchange", href: sxUrl } : null,
  ].filter(Boolean);

  links.forEach((link) => {
    const a = document.createElement("a");
    a.className = "data-link";
    if (link.href) {
      a.href = link.href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    if (link.repoPath) {
      a.setAttribute("data-download-repo", link.repoPath);
      a.classList.add("is-disabled");
      a.setAttribute("aria-disabled", "true");
    }
    a.textContent = link.label;
    actions.appendChild(a);
  });

  card.appendChild(titleRow);
  card.appendChild(desc);
  card.appendChild(meta);
  if (actions.children.length) card.appendChild(actions);

  return card;
}

async function loadProducts() {
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
    const reposForLinks = reposRes.status === "fulfilled" ? reposRes.value : cachedRepos;

    if (productsRes.status !== "fulfilled") {
      throw new Error("Request failed.");
    }

    const res = productsRes.value;
    if (!res.ok) throw new Error("Request failed (" + res.status + ").");
    const data = await res.json();
    const rawItems = Array.isArray(data && data.blueprintExtensions) ? data.blueprintExtensions : [];
    const items = attachGithubLinks(rawItems, reposForLinks);

    const themes = items.filter((p) => normalizeType(p && p.type) === "theme");
    const addons = items.filter((p) => normalizeType(p && p.type) !== "theme");

    if (addonCount) addonCount.textContent = String(addons.length);
    if (themeCount) themeCount.textContent = String(themes.length);

    if (addonsGrid) {
      addonsGrid.innerHTML = "";
      if (!addons.length) setGridMessage(addonsGrid, "No addons found yet.");
      addons.forEach((product) => addonsGrid.appendChild(createProductCard(product)));
      hydrateProductDownloads(addonsGrid);
      observeReveal(Array.from(addonsGrid.children));
    }

    if (themesGrid) {
      themesGrid.innerHTML = "";
      if (!themes.length) setGridMessage(themesGrid, "No themes found yet.");
      themes.forEach((product) => themesGrid.appendChild(createProductCard(product)));
      hydrateProductDownloads(themesGrid);
      observeReveal(Array.from(themesGrid.children));
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    if (addonsGrid) setGridMessage(addonsGrid, "Unable to load addons at this time.");
    if (themesGrid) setGridMessage(themesGrid, "Unable to load themes at this time.");
    if (addonCount) addonCount.textContent = "0";
    if (themeCount) themeCount.textContent = "0";
  }
}

document.querySelectorAll("section, .hero-media img, .feature-grid article").forEach((el) => {
  el.classList.add("reveal-base");
  observer.observe(el);
});

function initCarouselControls() {
  const buttons = Array.from(document.querySelectorAll(".carousel-btn"));
  if (!buttons.length) return;

  const loopState = new WeakMap();

  function getMaxScrollLeft(track) {
    return Math.max(0, track.scrollWidth - track.clientWidth);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.getAttribute("data-carousel");
      const direction = button.getAttribute("data-direction");
      const track = document.querySelector(`[data-carousel-track="${key}"]`);
      if (!track) return;

      const card = track.querySelector(".data-card");
      const cardWidth = card ? card.getBoundingClientRect().width : 260;
      const gap = 16;
      const amount = cardWidth + gap;
      const maxScroll = getMaxScrollLeft(track);

      if (direction === "next" && track.scrollLeft >= maxScroll - amount * 0.5) {
        track.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      if (direction === "prev" && track.scrollLeft <= amount * 0.5) {
        track.scrollTo({ left: maxScroll, behavior: "smooth" });
        return;
      }

      track.scrollBy({ left: direction === "next" ? amount : -amount, behavior: "smooth" });
    });
  });

  document.querySelectorAll(".carousel-track").forEach((track) => {
    if (!track) return;
    loopState.set(track, false);
  });
}

function initGalleryModal() {
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("image-modal-img");
  const modalCaption = document.getElementById("image-modal-caption");
  if (!modal || !modalImg || !modalCaption) return;

  const openModal = (src, alt) => {
    modalImg.src = src;
    modalImg.alt = alt || "";
    modalCaption.textContent = alt || "";
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

  document.querySelectorAll(".gallery-item").forEach((img) => {
    img.addEventListener("click", () => {
      openModal(img.currentSrc || img.src, img.alt);
    });
  });

  modal.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadContributors();
  loadDonators();
  loadProducts();
  initCarouselControls();
  initGalleryModal();
});
