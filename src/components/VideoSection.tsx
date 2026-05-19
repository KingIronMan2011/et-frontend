import { useEffect, useRef } from "react";
import { createRevealObserver, observeReveal } from "../utils/dom";

export function VideoSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = createRevealObserver();
    if (sectionRef.current) observeReveal(observer, [sectionRef.current]);

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="video">
      <div className="section-title grid">
        <h2>Watch the walkthrough</h2>
        <p>See the theme in motion with a full overview of the experience.</p>
      </div>
      <div className="video-frame relative overflow-hidden">
        <iframe
          src="https://www.youtube-nocookie.com/embed/PvEyH9zxlng?rel=0&modestbranding=1&playsinline=1"
          title="Euphoria theme walkthrough"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;"
          allowFullScreen
        ></iframe>
      </div>
    </section>
  );
}
