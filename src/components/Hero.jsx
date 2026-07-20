import { useEffect, useRef, useState } from "react";
import useIsMobile from "../hooks/useIsMobile";

const SPLINE_SCRIPT_SRC =
  "https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js";
const SPLINE_SCENE_URL =
  "https://prod.spline.design/BSDrRBYEFPmzQ5qL/scene.splinecode";
// If the 3D scene hasn't painted by this point, stop waiting and just keep
// the lightweight fallback — better than an indefinite blank hero section.
const SPLINE_TIMEOUT_MS = 8000;

function Hero() {
  const isMobile = useIsMobile();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [sceneVisible, setSceneVisible] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (isMobile) return;

    let cancelled = false;

    function markLoaded() {
      if (!cancelled) setScriptLoaded(true);
    }
    function markFailed() {
      if (!cancelled) setSceneFailed(true);
    }

    if (customElements.get("spline-viewer")) {
      markLoaded();
    } else {
      const existing = document.querySelector(`script[src="${SPLINE_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", markLoaded);
        existing.addEventListener("error", markFailed);
      } else {
        const script = document.createElement("script");
        script.type = "module";
        script.src = SPLINE_SCRIPT_SRC;
        script.onload = markLoaded;
        script.onerror = markFailed;
        document.head.appendChild(script);
      }
    }

    const timeout = setTimeout(markFailed, SPLINE_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [isMobile]);

  useEffect(() => {
    if (!scriptLoaded || isMobile) return;
    const el = viewerRef.current;
    if (!el) return;

    function handleLoad() {
      setSceneVisible(true);
    }
    function handleError() {
      setSceneFailed(true);
    }

    el.addEventListener("load", handleLoad);
    el.addEventListener("error", handleError);
    return () => {
      el.removeEventListener("load", handleLoad);
      el.removeEventListener("error", handleError);
    };
  }, [scriptLoaded, isMobile]);

  const showScene = !isMobile && scriptLoaded && !sceneFailed;

  return (
    <section className="relative w-full h-screen overflow-hidden bg-void">
      {/* Persistent gradient background — always present so the hero never
          appears blank, whether on mobile or while the 3D scene loads/fails */}
      <div className="absolute inset-0 bg-gradient-to-br from-void via-void-light to-void">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-gold-dim/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-crimson/10 rounded-full blur-3xl" />
      </div>

      {/* Spline 3D scene — desktop/tablet only, fades in once actually ready */}
      {showScene && (
        <spline-viewer
          ref={viewerRef}
          url={SPLINE_SCENE_URL}
          className="absolute inset-0 w-full h-full transition-opacity duration-700"
          style={{ opacity: sceneVisible ? 1 : 0 }}
        />
      )}

      {/* Vignette overlay so text stays readable over the 3D scene */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-void/70 via-transparent to-void" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-void/40 via-transparent to-void/40" />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 pointer-events-none">
        <p className="font-heading italic text-gold-light/80 tracking-[0.3em] text-sm md:text-base mb-4 uppercase">
          Beyond the Fog
        </p>

        <h1 className="font-display text-gold text-4xl md:text-6xl lg:text-7xl tracking-wide drop-shadow-[0_0_25px_rgba(184,149,47,0.3)]">
          Lord of the Mysteries
        </h1>

        <p className="font-heading text-parchment/70 text-lg md:text-xl mt-6 max-w-xl italic">
          "In the name of the Lord, let us pray for the fog to disperse..."
        </p>

        {/* Scroll cue */}
        <div className="absolute bottom-10 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-gold-dim text-lg tracking-[0.2em] uppercase font-heading">Descend</span>
          <div className="w-px h-10 bg-gradient-to-b from-gold-dim to-transparent" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
