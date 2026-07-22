import { useEffect, useRef, useState } from "react";
import useInView from "../hooks/useInView";

const SPLINE_SCRIPT_SRC =
  "https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js";
const SPLINE_SCENE_URL =
  "https://prod.spline.design/BSDrRBYEFPmzQ5qL/scene.splinecode";
// If the viewer script can't even load (blocked/offline) within this window,
// give up and just keep the lightweight gradient fallback.
const SPLINE_SCRIPT_TIMEOUT_MS = 10000;

// The Spline scene has its own internal responsive breakpoint: below a
// certain canvas width it swaps to a different, busier mobile composition
// (camera closer in, extra floating elements) rather than reusing the
// desktop layout. Feeding it a real (narrow) phone viewport size was
// triggering that mobile layout, which is why it looked so different from
// desktop. Instead we always size the scene at this fixed "desktop" virtual
// resolution — keeping the exact same composition everywhere — and then
// scale that virtual canvas to visually cover the real viewport with CSS,
// cropping the overflow like a background-size:cover image.
// Kept as small as it reasonably can be while still safely clearing
// Spline's own mobile breakpoint threshold, since every pixel here gets
// multiplied by the device's pixel ratio for the actual WebGL backing
// buffer — smaller design size = meaningfully less GPU work per frame.
const SCENE_DESIGN_WIDTH = 1024;
const SCENE_DESIGN_HEIGHT = 640;

function getViewportSize() {
  if (typeof window === "undefined") return { width: 0, height: 0 };
  return { width: window.innerWidth, height: window.innerHeight };
}

function Hero() {
  const sectionRef = useRef(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  // The Spline web component measures its own box on mount to size its
  // internal WebGL canvas. Handing it an explicit pixel size up front (based
  // on the viewport, which is always immediately known) — rather than
  // letting it infer size from percentage CSS — avoids the brief window
  // where it can read a 0x0 box and spam GL_INVALID_* framebuffer errors
  // while the browser is still settling layout.
  const [viewport, setViewport] = useState(getViewportSize);

  // Once the Hero is scrolled fully out of view, the 3D scene is unmounted
  // entirely (not just hidden) — that's what actually tears down the WebGL
  // context and stops the GPU from rendering 60 frames a second for a scene
  // nobody can see. rootMargin of 0 means it only unmounts once the section
  // has genuinely left the viewport, not the moment it starts scrolling.
  const heroInView = useInView(sectionRef, { rootMargin: "0px" });

  // Debounce the "leaving view" transition specifically: a quick scroll
  // flick past the boundary and back shouldn't force a full scene reload.
  // Coming back into view, on the other hand, should feel instant.
  const [sceneMounted, setSceneMounted] = useState(true);
  useEffect(() => {
    if (heroInView) {
      // Resetting this synchronously (rather than through an async callback)
      // is intentional: heroInView is itself external state driven by
      // IntersectionObserver, and the scene should reappear the instant the
      // section is back in view rather than lagging a tick behind.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSceneMounted(true);
      return;
    }
    const timeout = setTimeout(() => setSceneMounted(false), 600);
    return () => clearTimeout(timeout);
  }, [heroInView]);

  // The Spline 3D viewer is a heavy WebGL asset (several MB + GPU/battery
  // cost), so it's loaded once the browser is idle rather than instantly on
  // mount — on both desktop and mobile. spline-viewer handles touch input
  // (drag-to-orbit, pinch-to-zoom) the same way it handles mouse input, so
  // there's no separate mobile control scheme to wire up. A gradient
  // background is always rendered underneath, so even if the script or
  // scene fails to load, the hero never goes blank.
  useEffect(() => {
    let cancelled = false;
    let isReady = false;
    let timeout;

    const markReady = () => {
      if (cancelled || isReady) return;
      isReady = true;
      clearTimeout(timeout);
      setSceneReady(true);
    };
    const markFailed = () => {
      // Once the scene is ready, never let a stray/late error or the safety
      // timeout flip it back off — that was causing the 3D to appear and
      // then vanish again after a few seconds.
      if (cancelled || isReady) return;
      setSceneFailed(true);
    };

    // Already registered from an earlier mount/navigation — show immediately.
    if (customElements.get("spline-viewer")) {
      markReady();
      return () => {
        cancelled = true;
      };
    }

    let idleId;

    function loadSplineScript() {
      if (cancelled) return;

      const existing = document.querySelector(`script[src="${SPLINE_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", markReady);
        existing.addEventListener("error", markFailed);
      } else {
        const script = document.createElement("script");
        script.type = "module";
        script.src = SPLINE_SCRIPT_SRC;
        script.addEventListener("load", markReady);
        script.addEventListener("error", markFailed);
        document.head.appendChild(script);
      }

      // customElements.whenDefined resolves once the tag is actually usable —
      // more reliable than trusting the <script> "load" event alone, since
      // the module can still be doing async setup work after it fires.
      customElements.whenDefined("spline-viewer").then(markReady).catch(markFailed);

      timeout = setTimeout(markFailed, SPLINE_SCRIPT_TIMEOUT_MS);
    }

    // Kick off the multi-MB WebGL viewer once the browser is idle rather than
    // the instant Hero mounts. This lets the title, gradient background, and
    // rest of the first paint land immediately instead of competing with the
    // 3D scene's script/asset download for bandwidth and main-thread time —
    // the scene still appears within a fraction of a second either way.
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(loadSplineScript, { timeout: 1500 });
    } else {
      idleId = setTimeout(loadSplineScript, 0);
    }

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
      else clearTimeout(idleId);
    };
  }, []);

  // Keep the explicit pixel size in sync with the viewport, on every device.
  useEffect(() => {
    function handleResize() {
      setViewport(getViewportSize());
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showScene = sceneReady && !sceneFailed && sceneMounted;

  // "Cover" scale factor: how much to blow up the fixed design canvas so it
  // fully fills the real viewport in both dimensions (same math as CSS
  // background-size: cover), then crop whatever spills over the edges.
  const coverScale =
    viewport.width > 0 && viewport.height > 0
      ? Math.max(
          viewport.width / SCENE_DESIGN_WIDTH,
          viewport.height / SCENE_DESIGN_HEIGHT
        )
      : 1;

  return (
    <section ref={sectionRef} className="relative w-full h-screen overflow-hidden bg-void">
      {/* Persistent gradient background — always present so the hero never
          appears blank, whether on mobile or while the 3D scene loads/fails */}
      <div className="absolute inset-0 bg-gradient-to-br from-void via-void-light to-void">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-gold-dim/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-crimson/10 rounded-full blur-3xl" />
      </div>

      {/* Spline 3D scene — layered above the gradient on every device, always
          rendered at the fixed desktop composition and cropped to fit.
          Unmounted entirely once the section scrolls out of view so the GPU
          isn't rendering it 60x a second for nobody. */}
      {showScene && viewport.width > 0 && viewport.height > 0 && (
        <spline-viewer
          url={SPLINE_SCENE_URL}
          width={SCENE_DESIGN_WIDTH}
          height={SCENE_DESIGN_HEIGHT}
          className="absolute top-1/2 left-1/2"
          style={{
            width: `${SCENE_DESIGN_WIDTH}px`,
            height: `${SCENE_DESIGN_HEIGHT}px`,
            transform: `translate(-50%, -50%) scale(${coverScale})`,
            transformOrigin: "center",
          }}
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

        {/* Scroll cue — sits higher on small screens to clear the Spline
            attribution badge pinned in the bottom corner */}
        <div className="absolute bottom-20 sm:bottom-10 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-gold-dim text-lg tracking-[0.2em] uppercase font-heading">Descend</span>
          <div className="w-px h-10 bg-gradient-to-b from-gold-dim to-transparent" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
