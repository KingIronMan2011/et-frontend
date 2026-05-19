import { API } from "./constants";
import { normalizeType, observeReveal, safeUrl, setGridMessage } from "./dom";
import {
  attachGithubLinks,
  fetchGithubRepos,
  getRepoPathFromGithubUrl,
  loadGithubCache,
  saveGithubCache,
} from "./github";
import { hydrateProductDownloads } from "./releases";
import type { Product } from "./types";

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

export async function loadProducts(
  observer: IntersectionObserver,
): Promise<void> {
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
      if (!addons.length) {
        setGridMessage(addonsGrid, "No addons found yet.", observer);
      }
      addons.forEach((product) =>
        addonsGrid.appendChild(createProductCard(product)),
      );
      hydrateProductDownloads(addonsGrid);
      observeReveal(observer, addonsGrid.children);
    }

    if (themesGrid) {
      themesGrid.innerHTML = "";
      if (!themes.length) {
        setGridMessage(themesGrid, "No themes found yet.", observer);
      }
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
