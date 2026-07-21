import { useRef, useEffect } from "react";
import useInView from "../hooks/useInView";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";

function AmbientFog() {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const reducedMotion = usePrefersReducedMotion();
  const inView = useInView(canvasRef, { rootMargin: "150px 0px" });
  const active = inView && !reducedMotion;

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;
    let running = !document.hidden;

    // Each fog bank is a large radial gradient fill, which is one of the
    // most expensive things a canvas can draw. Capping the count (down from
    // the original 140) keeps per-frame paint cost low without the effect
    // looking noticeably sparser.
    const MAX_PARTICLES = 70;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function spawnParticle() {
      const isTop = Math.random() > 0.5;

      let spawnY, velocityY;

      if (isTop) {
        spawnY = -100 - Math.random() * 100;
        velocityY = Math.random() * 0.04 + 0.1;
      } else {
        spawnY = canvas.height + 100 + Math.random() * 100;
        velocityY = -(Math.random() * 0.04 + 0.6);
      }

      particles.current.push({
        x: Math.random() * canvas.width,
        y: spawnY,
        vx: (Math.random() - 0.5) * 0.08,
        vy: velocityY,
        radius: Math.random() * 220 + 160,
        life: 0,
        maxLife: Math.random() * 0.35 + 0.45,
        decay: Math.random() * 0.0007 + 0.0004,
        growing: true,
      });
    }

    for (let i = 0; i < 12; i++) {
      const isTopZone = i % 2 === 0;
      let initialY, velocityY;

      if (isTopZone) {
        initialY = Math.random() * (canvas.height * 0.3);
        velocityY = Math.random() * 0.04 + 0.01;
      } else {
        initialY = canvas.height - Math.random() * (canvas.height * 0.3);
        velocityY = -(Math.random() * 0.04 + 0.01);
      }

      particles.current.push({
        x: Math.random() * canvas.width,
        y: initialY,
        vx: (Math.random() - 0.5) * 0.06,
        vy: velocityY,
        radius: Math.random() * 220 + 160,
        life: Math.random() * 0.4 + 0.2,
        maxLife: Math.random() * 0.35 + 0.45,
        decay: Math.random() * 0.0007 + 0.0004,
        growing: true,
      });
    }

    let spawnTimer = 0;

    function handleVisibility() {
      running = !document.hidden;
      if (running) animationId = requestAnimationFrame(animate);
    }
    document.addEventListener("visibilitychange", handleVisibility);

    function animate() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      spawnTimer++;
      if (spawnTimer > 5 && particles.current.length < MAX_PARTICLES) {
        spawnParticle();
        spawnTimer = 0;
      }

      particles.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.radius += 0.02;

        if (p.growing) {
          p.life += p.decay * 2.5;
          if (p.life >= p.maxLife) p.growing = false;
        } else {
          p.life -= p.decay;
        }

        if (p.life > 0) {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          gradient.addColorStop(0, `rgba(61, 69, 72, ${p.life * 0.18})`);
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
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(animationId);
      particles.current = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

export default AmbientFog;
