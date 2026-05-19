type ProductCarouselProps = {
  countId: string;
  gridId: string;
  loadingLabel: string;
  title: string;
  trackKey: "addons" | "themes";
};

function ProductCarousel({
  countId,
  gridId,
  loadingLabel,
  title,
  trackKey,
}: ProductCarouselProps) {
  return (
    <div className="product-block">
      <div className="product-block-title flex items-center justify-between font-semibold">
        <div>
          <h3>{title}</h3>
          <span>
            (<span id={countId}>0</span>)
          </span>
        </div>
        <div
          className="carousel-controls flex"
          aria-label={`${title.toLowerCase()} carousel controls`}
        >
          <button
            className="carousel-btn cursor-pointer"
            type="button"
            data-carousel={trackKey}
            data-direction="prev"
            aria-label={`Scroll ${trackKey} left`}
          >
            &lsaquo;
          </button>
          <button
            className="carousel-btn cursor-pointer"
            type="button"
            data-carousel={trackKey}
            data-direction="next"
            aria-label={`Scroll ${trackKey} right`}
          >
            &rsaquo;
          </button>
        </div>
      </div>
      <div
        className="carousel-track overflow-x-auto overflow-y-hidden"
        data-carousel-track={trackKey}
      >
        <div id={gridId} className="data-grid carousel-grid flex">
          <article className="data-card loading">{loadingLabel}</article>
        </div>
      </div>
    </div>
  );
}

export function ProductsSection() {
  return (
    <section id="products" className="products">
      <div className="section-title grid">
        <h2>Our products</h2>
        <p>
          Most of our features are also available independently and compatible
          with most themes.
        </p>
      </div>
      <ProductCarousel
        countId="blueprint-addon-count"
        gridId="blueprint-addons-grid"
        loadingLabel="Loading addons..."
        title="Blueprint Addons"
        trackKey="addons"
      />
      <ProductCarousel
        countId="blueprint-theme-count"
        gridId="blueprint-themes-grid"
        loadingLabel="Loading themes..."
        title="Blueprint Themes"
        trackKey="themes"
      />
    </section>
  );
}
