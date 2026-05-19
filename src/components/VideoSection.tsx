import { useEffect, useRef } from "react";
import "lite-youtube-embed/src/lite-yt-embed.css";
import "lite-youtube-embed/src/lite-yt-embed.js";
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
        <lite-youtube
          videoid="PvEyH9zxlng"
          title="Euphoria theme walkthrough"
          playlabel="Play: Euphoria theme walkthrough"
          params="rel=0&modestbranding=1"
        ></lite-youtube>
      </div>
    </section>
  );
}
