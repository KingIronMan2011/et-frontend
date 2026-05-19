export function BackgroundEffects() {
  return (
    <>
      <div
        className="orb orb-1 fixed z-[-2] rounded-full"
        aria-hidden="true"
      ></div>
      <div
        className="orb orb-2 fixed z-[-2] rounded-full"
        aria-hidden="true"
      ></div>
      <div
        className="grid-overlay fixed inset-0 z-[-3]"
        aria-hidden="true"
      ></div>
    </>
  );
}
