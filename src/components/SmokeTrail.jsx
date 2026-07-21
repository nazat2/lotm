import { useRef, useEffect } from "react";
import useInView from "../hooks/useInView";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";

function SmokeTrail() {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const reducedMotion = usePrefersReducedMotion();
  const inView = useInView(canvasRef, { rootMargin: "150px 0px" });
  const active = inView && !reducedMotion;

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    const section = canvas.parentElement;
    const ctx = canvas.getContext("2d");
    let animationId;
    let running = !document.hidden;
    let lastSpawn = 0;
    const SPAWN_INTERVAL = 30; // throttle mousemove-driven spawns
    const MAX_PARTICLES = 160;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function handleMouseMove(e) {
      const now = performance.now();
      if (now - lastSpawn < SPAWN_INTERVAL) return;
      lastSpawn = now;
      if (particles.current.length >= MAX_PARTICLES) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (let i = 0; i < 4; i++) {
        particles.current.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -Math.random() * 0.6 - 0.2,
          radius: Math.random() * 18 + 12,
          life: 1,
          decay: Math.random() * 0.003 + 0.002,
        });
      }
    }

    section.addEventListener("mousemove", handleMouseMove, { passive: true });

    function handleVisibility() {
      running = !document.hidden;
      if (running) animationId = requestAnimationFrame(animate);
    }
    document.addEventListener("visibilitychange", handleVisibility);

    function animate() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.radius += 0.15;

        if (p.life > 0) {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          gradient.addColorStop(0, `rgba(61, 69, 72, ${p.life * 0.35})`);
          gradient.addColorStop(1, "rgba(61, 69, 72, 0)");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      particles.current = particles.current.filter((p) => p.life > 0);
      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      section.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(animationId);
      particles.current = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
    />
  );
}

export default SmokeTrail;
