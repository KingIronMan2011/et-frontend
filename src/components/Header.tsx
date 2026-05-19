export function Header() {
  return (
    <header className="topbar sticky top-0 z-10 flex items-center justify-between border-b">
      <div className="brand flex items-center font-bold">
        <img src="/web-app-manifest-512x512.png" alt="Euphoria logo" />
        <span>Euphoria</span>
      </div>
      <nav className="nav flex font-medium">
        <a href="#features">Features</a>
        <a href="#gallery">Showcase</a>
        <a href="#products">Products</a>
        <a href="#community">Community</a>
        <a href="#about">About</a>
      </nav>
      <div className="cta-group flex">
        <a
          className="ghost"
          href="https://demo.euphoriatheme.uk"
          target="_blank"
          rel="noreferrer"
        >
          Demo Panel
        </a>
        <a className="solid" href="#products">
          Get the theme
        </a>
      </div>
    </header>
  );
}
