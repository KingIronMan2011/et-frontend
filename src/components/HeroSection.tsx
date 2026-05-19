export function HeroSection() {
  return (
    <section className="hero grid items-center">
      <div className="hero-copy">
        <p className="eyebrow">Euphoria Theme</p>
        <h1>Revive your panel.</h1>
        <p className="lede">
          A theme built for the Pterodactyl panel, using the Blueprint
          Framework. Euphoria delivers a modern, customizable experience that
          keeps evolving.
        </p>
        <div className="hero-actions flex flex-wrap">
          <a
            className="solid"
            href="https://demo.euphoriatheme.uk"
            target="_blank"
            rel="noreferrer"
          >
            Try the demo
          </a>
          <a className="ghost" href="#products">
            Where to buy
          </a>
        </div>
        <div className="hero-stats flex flex-wrap font-semibold">
          <div>
            <span className="stat">Always evolving</span>
            <span className="label">New styling &amp; features</span>
          </div>
          <div>
            <span className="stat">Theme + addons</span>
            <span className="label">Modular extensions</span>
          </div>
        </div>
      </div>
      <div className="hero-media relative">
        <img
          src="/images/dashboard.webp"
          alt="Euphoria theme header preview"
          decoding="async"
          fetchPriority="high"
        />
        <div className="badge absolute font-semibold">Always evolving</div>
      </div>
    </section>
  );
}
