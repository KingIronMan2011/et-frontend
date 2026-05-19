import { observeReveal, safeUrl, setGridMessage } from "./dom";
import type { Person } from "./types";

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

export async function loadPeople(
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
