const features = [
  {
    title: "Theme Customizer",
    copy: "Dial in colors, spacing, and layout preferences without touching your core panel.",
  },
  {
    title: "Live UI Enhancements",
    copy: "Modernize navigation, server cards, and dashboards with a clean, confident look.",
  },
  {
    title: "Premium Visuals",
    copy: "Designed to feel polished out of the box with layered backgrounds and depth.",
  },
  {
    title: "Modular Add-ons",
    copy: "Expand with plugins like Player Listing and MC Logs.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="features">
      <div className="section-title grid">
        <h2>Always evolving.</h2>
        <p>
          We have left the beta phase and already shipped updates with fresh
          styling, customization, and new features for the Pterodactyl panel.
        </p>
      </div>
      <div className="feature-grid grid">
        {features.map((feature) => (
          <article key={feature.title}>
            <h3>{feature.title}</h3>
            <p>{feature.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
