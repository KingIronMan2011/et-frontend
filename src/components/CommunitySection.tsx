import { useEffect, useRef } from "react";
import { API } from "../utils/constants";
import { createRevealObserver, observeReveal } from "../utils/dom";
import { loadPeople } from "../utils/people";

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
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = createRevealObserver();
    if (sectionRef.current) observeReveal(observer, [sectionRef.current]);

    void loadPeople(
      "contributors-grid",
      API.contributors,
      "Contributor",
      "No contributors found yet.",
      "Unable to load contributors at this time.",
      observer,
    );
    void loadPeople(
      "donators-grid",
      API.donators,
      "Supporter",
      "No donators found yet.",
      "Unable to load donators at this time.",
      observer,
    );

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="community" className="community">
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
