import { useEffect, useState } from "react";

/**
 * Respects the OS-level "reduce motion" accessibility setting. People who
 * enable this are often on lower-powered hardware or are sensitive to
 * constant on-screen movement, so the decorative canvas trails skip
 * themselves entirely rather than just running quieter.
 */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

export default usePrefersReducedMotion;
