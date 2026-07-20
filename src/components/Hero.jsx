import { useEffect, useRef, useState } from "react";

const SPLINE_SRC = "https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js";
const SPLINE_SCENE = "https://prod.spline.design/BSDrRBYEFPmzQ5qL/scene.splinecode";
const SESSION_FLAG = "lotm_3d_disabled";
const MIN_ACCEPTABLE_FPS = 20;
const WATCHDOG_WARMUP_MS = 1200; // give the scene time to spin up before judging it
const WATCHDOG_SAMPLE_MS = 3000;

// Loads the (fairly heavy) Spline custom element script exactly once, on demand.
let splineScriptPromise = null;
function loadSplineViewer() {
  if (customElements.get("spline-viewer")) return Promise.resolve();
  if (splineScriptPromise) return splineScriptPromise;

  splineScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = SPLINE_SRC;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return splineScriptPromise;
}

function Hero() {
  const sectionRef = useRef(null);
  const viewerRef = useRef(null);
  const watchdogRef = useRef({ raf: null, frames: 0, start: 0, warmedUp: false });

  const [eligibleFor3D, setEligibleFor3D] = useState(false);
  const [inView, setInView] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [splineReady, setSplineReady] = useState(false);
  const [splineFailed, setSplineFailed] = useState(false);

  // Decide up front whether it's even worth trying the 3D scene.
  useEffect(() => {
    const alreadyFailedThisSession = sessionStorage.getItem(SESSION_FLAG) === "1";
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isVeryLowEndDevice =
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency <= 2;
    const conn = navigator.connection || navigator.webkitConnection;
    const isSlowConnection =
      !!conn && (conn.saveData || /2g/.test(conn.effectiveType || ""));

    if (
      alreadyFailedThisSession ||
      prefersReducedMotion ||
      isVeryLowEndDevice ||
      isSlowConnection
    ) {
      setEligibleFor3D(false);
      setSplineFailed(true); // ensures the gradient fallback is used, no watchdog needed
      return;
    }

    setEligibleFor3D(true);
  }, []);

  // Mount/unmount based on whether the hero is actually on screen — this frees
  // the GPU/WebGL context once the user has scrolled past it.
  useEffect(() => {
    if (!eligibleFor3D) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px", threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [eligibleFor3D]);

  // Also pause while the browser tab itself is hidden.
  useEffect(() => {
    function handleVisibility() {
      setDocumentVisible(!document.hidden);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const shouldRender3D = eligibleFor3D && inView && documentVisible && !splineFailed;

  useEffect(() => {
    if (!shouldRender3D) return;
    let cancelled = false;
    loadSplineViewer()
      .then(() => {
        if (!cancelled) setSplineReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setSplineFailed(true);
          sessionStorage.setItem(SESSION_FLAG, "1");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shouldRender3D]);

  // FPS watchdog: if the scene is genuinely struggling on this device, bail
  // out to the lightweight gradient instead of leaving the page janky.
  useEffect(() => {
    if (!splineReady || splineFailed) return;

    const state = watchdogRef.current;
    state.frames = 0;
    state.start = 0;
    state.warmedUp = false;

    function tick(timestamp) {
      if (!state.start) state.start = timestamp;
      const elapsed = timestamp - state.start;

      if (!state.warmedUp) {
        if (elapsed >= WATCHDOG_WARMUP_MS) {
          state.warmedUp = true;
          state.start = timestamp;
          state.frames = 0;
        }
        state.raf = requestAnimationFrame(tick);
        return;
      }

      state.frames += 1;

      if (elapsed >= WATCHDOG_SAMPLE_MS) {
        const fps = (state.frames / elapsed) * 1000;
        if (fps < MIN_ACCEPTABLE_FPS) {
          setSplineFailed(true);
          sessionStorage.setItem(SESSION_FLAG, "1");
        }
        return; // watchdog only needs to judge once
      }

      state.raf = requestAnimationFrame(tick);
    }

    state.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(state.raf);
  }, [splineReady, splineFailed]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden bg-void"
    >
      {/* Lightweight static backdrop — always rendered so there's never a
          blank flash while the 3D scene loads in, and it's the permanent
          look for devices where 3D isn't attempted or the watchdog bails out */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(61,69,72,0.35),_transparent_65%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_110%,_rgba(184,149,47,0.12),_transparent_60%)]" />

      {/* Spline 3D scene — attempted on any capable device, but self-monitors
          and quietly falls back to the gradient above if it can't keep up */}
      {shouldRender3D && (
        <spline-viewer
          ref={viewerRef}
          url={SPLINE_SCENE}
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
            splineReady ? "opacity-100" : "opacity-0"
          }`}
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
