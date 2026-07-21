import { useRef, useEffect } from "react";
import useIsMobile from "../hooks/useIsMobile";

// A small, curated subset of the pathway tarot images (not all 22) so the
// trail effect stays light — these are preloaded once and shared across
// every ImageTrail instance on the page (World + I Was Here sections).
const TRAIL_IMAGES = [
  "/images/pathways/0fool.jpg",
  "/images/pathways/2priestess.jpg",
  "/images/pathways/9hermit.jpg",
  "/images/pathways/13death.jpg",
  "/images/pathways/16tower.jpg",
  "/images/pathways/17star.jpg",
  "/images/pathways/18moon.jpg",
  "/images/pathways/21world.jpg",
];

// Module-level cache: images are only ever fetched/decoded once, no matter
// how many ImageTrail instances mount across the page.
let cachedImages = null;
function getTrailImages() {
  if (!cachedImages) {
    cachedImages = TRAIL_IMAGES.map((src) => {
      const img = new Image();
      img.src = src;
      img.decoding = "async";
      return img;
    });
  }
  return cachedImages;
}

function ImageTrail() {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas.parentElement; // listen on the section, not the canvas
    const ctx = canvas.getContext("2d");
    const images = getTrailImages();

    let animationId;
    let lastSpawn = 0;

    // Keep things light: fewer, smaller, shorter-lived cards on mobile.
    const MAX_PARTICLES = isMobile ? 12 : 20;
    const SPAWN_INTERVAL = isMobile ? 90 : 50;
    const BASE_SIZE = isMobile ? 46 : 60;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function spawn(x, y) {
      const now = performance.now();
      if (now - lastSpawn < SPAWN_INTERVAL) return;
      if (particles.current.length >= MAX_PARTICLES) return;
      lastSpawn = now;

      const img = images[Math.floor(Math.random() * images.length)];
      const size = BASE_SIZE + Math.random() * 20;

      particles.current.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.5 - 0.15,
        rotation: (Math.random() - 0.5) * 0.6,
        rotSpeed: (Math.random() - 0.5) * 0.01,
        size,
        img,
        life: 1,
        decay: Math.random() * 0.008 + 0.01,
      });
    }

    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      spawn(e.clientX - rect.left, e.clientY - rect.top);
    }

    function handleTouch(e) {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = canvas.getBoundingClientRect();
      spawn(touch.clientX - rect.left, touch.clientY - rect.top);
    }

    section.addEventListener("mousemove", handleMouseMove, { passive: true });
    section.addEventListener("touchstart", handleTouch, { passive: true });
    section.addEventListener("touchmove", handleTouch, { passive: true });

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.life -= p.decay;

        // Only draw once the image has actually finished decoding — avoids
        // ever drawing a blank/broken frame on a slower connection.
        if (p.life > 0 && p.img.complete && p.img.naturalWidth > 0) {
          const w = p.size;
          const h = p.size * 1.4; // matches the ~5:7 tarot card aspect ratio
          ctx.save();
          ctx.globalAlpha = Math.max(p.life, 0);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.drawImage(p.img, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
      });

      particles.current = particles.current.filter((p) => p.life > 0);
      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      section.removeEventListener("mousemove", handleMouseMove);
      section.removeEventListener("touchstart", handleTouch);
      section.removeEventListener("touchmove", handleTouch);
      cancelAnimationFrame(animationId);
      particles.current = [];
    };
  }, [isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
    />
  );
}

export default ImageTrail;
