import { useEffect, useState } from "react";

/**
 * Tracks whether `ref.current` is (roughly) within the viewport, so callers
 * can pause expensive work — canvas rAF loops, particle systems, etc. —
 * while a section is scrolled out of view. This is the single biggest lever
 * for cutting idle CPU/GPU usage on a long scrolling page like this one:
 * without it, every canvas effect on the page keeps animating 60x a second
 * forever, even the ones nowhere near the screen.
 *
 * A generous rootMargin means work resumes slightly before the section is
 * actually visible, so there's no visible "pop-in" of the effect.
 */
function useInView(ref, { rootMargin = "200px 0px", once = false } = {}) {
  const supportsObserver =
    typeof IntersectionObserver !== "undefined";
  // Environments without IntersectionObserver (very old browsers/SSR):
  // fail open so the effect just always runs, rather than never.
  const [inView, setInView] = useState(!supportsObserver);

  useEffect(() => {
    if (!supportsObserver) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, rootMargin, once, supportsObserver]);

  return inView;
}

export default useInView;
