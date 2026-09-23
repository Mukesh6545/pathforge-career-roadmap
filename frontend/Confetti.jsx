import { useEffect, useRef } from "react";

const COLORS = ["#cf9a37", "#2a52a3", "#1f9d66", "#d1453f", "#7c3aed", "#ec4899", "#f59e0b"];
const PARTICLE_COUNT = 120;
const GRAVITY = 0.003;
const DRAG = 0.98;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

export default function Confetti({ fire, onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!fire) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: canvas.width / 2 + randomBetween(-100, 100),
      y: canvas.height / 2,
      vx: randomBetween(-0.015, 0.015) * canvas.width,
      vy: randomBetween(-0.025, -0.005) * canvas.height,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: randomBetween(4, 10),
      rotation: randomBetween(0, 360),
      rotSpeed: randomBetween(-8, 8),
      opacity: 1,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));

    let frame;
    let startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      if (elapsed > 3000) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onDone && onDone();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += GRAVITY * canvas.height;
        p.vx *= DRAG;
        p.vy *= DRAG;
        p.rotation += p.rotSpeed;
        p.opacity = Math.max(0, 1 - elapsed / 2800);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [fire, onDone]);

  if (!fire) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    />
  );
}
