const quickLinks = [
  {
    href: "https://status.euphoriadevelopment.uk/status/euphoria",
    label: "Service Status",
  },
  {
    href: "https://discord.gg/Cus2zP4pPH",
    label: "Support",
  },
  {
    href: "https://www.sourcexchange.net/products/euphoriatheme",
    label: "SourceXchange",
  },
  {
    href: "https://builtbybit.com/resources/euphoria.52856/",
    label: "BuiltByBit",
  },
];

type SupporterBlockProps = {
  gridId: string;
  loadingLabel: string;
  title: string;
};

function SupporterBlock({ gridId, loadingLabel, title }: SupporterBlockProps) {
  return (
    <div className="community-block">
      <h3>{title}</h3>
      <div id={gridId} className="data-grid grid">
        <article className="data-card loading">{loadingLabel}</article>
      </div>
    </div>
  );
}

export function CommunitySection() {
  return (
    <section id="community" className="community">
      <div className="section-title grid">
        <h2>Our supporters</h2>
        <p>Thanks to the teams and individuals who keep Euphoria growing.</p>
      </div>
      <div className="community-split grid items-start">
        <SupporterBlock
          gridId="contributors-grid"
          loadingLabel="Loading contributors..."
          title="Contributors"
        />
        <SupporterBlock
          gridId="donators-grid"
          loadingLabel="Loading donators..."
          title="Donators"
        />
      </div>
      <div className="card quick-links">
        <h3>Quick links</h3>
        <ul>
          {quickLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
