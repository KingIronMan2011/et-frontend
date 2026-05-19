import type { Cleanup } from "./types";

export function initGalleryModal(): Cleanup {
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
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  };
  document.addEventListener("keydown", onKeyDown);
  cleanups.push(() => document.removeEventListener("keydown", onKeyDown));

  return () => {
    closeModal();
    cleanups.forEach((cleanup) => cleanup());
  };
}
