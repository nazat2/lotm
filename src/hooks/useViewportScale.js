import { useState, useEffect } from "react";

/**
 * Returns a scale factor (clamped between min and max) proportional to how the
 * current viewport width compares to a reference "designed for" width.
 * Used to shrink wide, fixed-offset layouts (carousels, fanned card spreads)
 * so they stay fully visible and well-proportioned on tablets and small
 * desktop windows instead of overflowing or getting clipped.
 */
function useViewportScale(referenceWidth = 1100, min = 0.55, max = 1) {
  const getScale = () => {
    if (typeof window === "undefined") return max;
    const available = window.innerWidth - 32; // rough horizontal padding allowance
    return Math.min(max, Math.max(min, available / referenceWidth));
  };

  const [scale, setScale] = useState(getScale);

  useEffect(() => {
    let frame;
    function handleResize() {
      // rAF-throttle so rapid resize/orientation events don't thrash layout
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScale(getScale()));
    }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return scale;
}

export default useViewportScale;
