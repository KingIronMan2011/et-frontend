export function AboutSection() {
  return (
    <section id="about" className="about">
      <div className="about-inner grid items-center">
        <div>
          <h2>About Euphoria</h2>
          <p>
            Euphoria is a customizable theme built for the Pterodactyl panel,
            using the Blueprint Framework to enhance the server management
            experience. Join the Discord community to stay updated on new
            features and releases.
          </p>
        </div>
        <div className="about-links flex flex-wrap">
          <a
            href="https://discord.gg/Cus2zP4pPH"
            target="_blank"
            rel="noreferrer"
          >
            Join Discord
          </a>
          <a
            href="https://github.com/EuphoriaTheme"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://www.youtube.com/@RepGraphics"
            target="_blank"
            rel="noreferrer"
          >
            YouTube
          </a>
        </div>
      </div>
    </section>
  );
}
