export function safeUrl(url: unknown): string | null {
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

export function normalizeType(type: unknown): string {
  return String(type || "")
    .trim()
    .toLowerCase();
}

export function createRevealObserver(): IntersectionObserver {
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

  return observer;
}

export function observeReveal(
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

export function setGridMessage(
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
