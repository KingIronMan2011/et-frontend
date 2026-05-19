const galleryImages = [
  {
    src: "/images/theme-customiser.webp",
    alt: "Theme customizer view",
  },
  {
    src: "/images/console.webp",
    alt: "Console view",
  },
  {
    src: "/images/login.webp",
    alt: "Login view",
  },
];

function ImageModal() {
  return (
    <div
      className="image-modal pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
      id="image-modal"
      aria-hidden="true"
    >
      <div
        className="image-modal-backdrop absolute inset-0"
        data-modal-close
      ></div>
      <div
        className="image-modal-content relative z-[1] grid"
        role="dialog"
        aria-modal="true"
        aria-label="Image preview"
      >
        <button
          className="image-modal-close absolute cursor-pointer"
          type="button"
          data-modal-close
          aria-label="Close image"
        >
          &times;
        </button>
        <img id="image-modal-img" alt="" />
        <p id="image-modal-caption"></p>
      </div>
    </div>
  );
}

export function GallerySection() {
  return (
    <>
      <section id="gallery" className="gallery">
        <div className="section-title grid">
          <h2>See Euphoria in action.</h2>
          <p>
            Before, after, and everything in between. The theme adapts to every
            panel layout.
          </p>
        </div>
        <div className="gallery-grid grid">
          {galleryImages.map((image) => (
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              loading="lazy"
              decoding="async"
              className="gallery-item"
            />
          ))}
        </div>
      </section>
      <ImageModal />
    </>
  );
}
