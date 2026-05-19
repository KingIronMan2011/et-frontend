import type { Cleanup } from "./types";

export function initCarouselControls(): Cleanup {
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
