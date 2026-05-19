export function VideoSection() {
  return (
    <section className="video">
      <div className="section-title grid">
        <h2>Watch the walkthrough</h2>
        <p>See the theme in motion with a full overview of the experience.</p>
      </div>
      <div className="video-frame relative overflow-hidden">
        <iframe
          src="https://www.youtube-nocookie.com/embed/PvEyH9zxlng?rel=0&modestbranding=1&playsinline=1"
          title="Euphoria theme walkthrough"
          frameBorder="0"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;"
          allowFullScreen
        ></iframe>
      </div>
    </section>
  );
}
