// Éléments décoratifs HUD : coins bracket, mini arc-reactor animé, horloge.
import { useEffect, useState } from "react";

/** Quatre coins "bracket" façon viseur, posés sur le panneau. */
export function Brackets() {
  return (
    <>
      <span className="bk bk-tl" aria-hidden="true" />
      <span className="bk bk-tr" aria-hidden="true" />
      <span className="bk bk-bl" aria-hidden="true" />
      <span className="bk bk-br" aria-hidden="true" />
    </>
  );
}

/** Petit arc-reactor : cercles concentriques en rotation lente. */
export function ArcMark() {
  return (
    <svg
      className="arc"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <circle
        className="arc-outer"
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="10 6"
      />
      <circle
        className="arc-inner"
        cx="12"
        cy="12"
        r="6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <circle className="arc-core" cx="12" cy="12" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="clock">
      {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
    </span>
  );
}
