"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  baseR: number;
  color: string;
}

interface Entanglement {
  a: number;
  b: number;
  progress: number;
}

// ── Constants ──────────────────────────────────────────────────

const COLORS = ["#a855f7", "#00f3ff", "#ffffff"] as const;
const WAVE_THRESHOLD = 170;
const OBSERVER_THRESHOLD = 220;
const MOUSE_ATTRACT_RADIUS = 250;
const MOUSE_ATTRACT_STRENGTH = 0.035;
const MOUSE_GLOW_RADIUS = 60;
const PARTICLE_MIN_R = 1.5;
const PARTICLE_MAX_R = 4.5;
const PARTICLE_COUNT_BASE = 350;
const PARTICLE_COUNT_MAX = 700;
const ENTANGLEMENT_INTERVAL = 4000;
const ENTANGLEMENT_DECAY_SPEED = 0.012;
const GRID_CELL_SIZE = WAVE_THRESHOLD;

// ── Helpers ────────────────────────────────────────────────────

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function createParticle(w: number, h: number): Particle {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const r = randomBetween(PARTICLE_MIN_R, PARTICLE_MAX_R);
  // Slightly higher initial speeds so particles drift more freely
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: randomBetween(-1.8, 1.8),
    vy: randomBetween(-1.8, 1.8),
    r,
    baseR: r,
    color,
  };
}

// Spatial hash grid for O(n) neighbor lookups
function buildSpatialGrid(particles: Particle[], w: number, h: number) {
  const grid = new Map<string, number[]>();
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const cellX = Math.floor(p.x / GRID_CELL_SIZE);
    const cellY = Math.floor(p.y / GRID_CELL_SIZE);
    const key = `${cellX},${cellY}`;
    const cell = grid.get(key);
    if (cell) {
      cell.push(i);
    } else {
      grid.set(key, [i]);
    }
  }
  return grid;
}

function getNeighborIndices(
  x: number,
  y: number,
  grid: Map<string, number[]>
): number[] {
  const cellX = Math.floor(x / GRID_CELL_SIZE);
  const cellY = Math.floor(y / GRID_CELL_SIZE);
  const neighbors: number[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const key = `${cellX + dx},${cellY + dy}`;
      const cell = grid.get(key);
      if (cell) {
        neighbors.push(...cell);
      }
    }
  }
  return neighbors;
}

// ── Component ──────────────────────────────────────────────────

export default function QuantumBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const entanglementsRef = useRef<Entanglement[]>([]);
  const rafRef = useRef<number>(0);
  const lastEntanglementRef = useRef(0);

  const visibleRef = useRef(true);    const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !visibleRef.current) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parentEl = canvas.parentElement;
    const bounds = parentEl?.getBoundingClientRect();
    const cW = bounds?.width ?? window.innerWidth;
    const cH = bounds?.height ?? window.innerHeight;
    const particles = particlesRef.current;
    const mouse = mouseRef.current;
    const mouseActive = mouse.x > -9000 && mouse.y > -9000;

    // Clear
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cW, cH);

    // ── Entanglement spawning ────────────────────────────────
    if (
      timestamp - lastEntanglementRef.current > ENTANGLEMENT_INTERVAL &&
      particles.length >= 2
    ) {
      lastEntanglementRef.current = timestamp;
      const a = Math.floor(Math.random() * particles.length);
      let b = Math.floor(Math.random() * particles.length);
      while (b === a) b = Math.floor(Math.random() * particles.length);
      entanglementsRef.current.push({ a, b, progress: 0 });
    }

    // Build spatial grid once per frame
    const grid = buildSpatialGrid(particles, cW, cH);

    // Additive blending
    ctx.globalCompositeOperation = "lighter";

    // ── Update & draw particles ──────────────────────────────
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // ── Mouse attraction ──────────────────────────────────
      if (mouseActive) {
        const mdx = mouse.x - p.x;
        const mdy = mouse.y - p.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mDist < MOUSE_ATTRACT_RADIUS && mDist > 1) {
          // Stronger pull the closer the particle is to the cursor
          const falloff = 1 - mDist / MOUSE_ATTRACT_RADIUS;
          const strength = MOUSE_ATTRACT_STRENGTH * falloff * falloff;
          p.vx += (mdx / mDist) * strength;
          p.vy += (mdy / mDist) * strength;
          // Glow brighter near cursor
          p.r += (p.baseR + 2.0 * falloff - p.r) * 0.12;
        } else {
          p.r += (p.baseR - p.r) * 0.08;
        }
      } else {
        p.r += (p.baseR - p.r) * 0.08;
      }

      // ── Minimal inter-particle repel (prevent overlap only) ─
      const neighbors = getNeighborIndices(p.x, p.y, grid);
      for (let n = 0; n < neighbors.length; n++) {
        const j = neighbors[n];
        if (i === j) continue;
        const other = particles[j];
        const dx = other.x - p.x;
        const dy = other.y - p.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 14 && d > 0.1) {
          // Soft repel to avoid stacking
          const repel = 0.06 * (1 - d / 14);
          p.vx -= (dx / d) * repel;
          p.vy -= (dy / d) * repel;
        }
      }

      // Subtle random turbulence
      p.vx += (Math.random() - 0.5) * 0.1;
      p.vy += (Math.random() - 0.5) * 0.1;

      // Damping
      p.vx *= 0.995;
      p.vy *= 0.995;

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Bounce off edges
      if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
      else if (p.x > cW) { p.x = cW; p.vx = -Math.abs(p.vx); }
      if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
      else if (p.y > cH) { p.y = cH; p.vy = -Math.abs(p.vy); }

      // Core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    // ── Visible connecting lines ─────────────────────────────
    ctx.lineWidth = 0.75;

    for (let i = 0; i < particles.length; i++) {
      const pA = particles[i];
      const neighbors = getNeighborIndices(pA.x, pA.y, grid);

      for (let n = 0; n < neighbors.length; n++) {
        const j = neighbors[n];
        if (j <= i) continue;

        const pB = particles[j];
        const dx = pB.x - pA.x;
        const dy = pB.y - pA.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > WAVE_THRESHOLD) continue;

        const alpha = (1 - d / WAVE_THRESHOLD) * 0.2;
        ctx.strokeStyle = `rgba(0,243,255,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();
      }
    }

    // ── Entanglement beams ───────────────────────────────────
    const ent = entanglementsRef.current;
    for (let i = ent.length - 1; i >= 0; i--) {
      const e = ent[i];
      e.progress += ENTANGLEMENT_DECAY_SPEED;

      if (e.progress >= 1) {
        ent.splice(i, 1);
        continue;
      }

      const ptA = particles[e.a];
      const ptB = particles[e.b];
      if (!ptA || !ptB) continue;

      const intensity = Math.sin(e.progress * Math.PI);
      const alpha = intensity * 0.7;

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(168,85,247,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(ptA.x, ptA.y);
      ctx.lineTo(ptB.x, ptB.y);
      ctx.stroke();
    }

    // ── Glowing neon cyan mouse cursor ───────────────────────
    if (mouseActive) {
      const pulse = 0.8 + Math.sin(timestamp * 0.004) * 0.2;
      const glowR = MOUSE_GLOW_RADIUS * pulse;

      // Outer soft glow
      const outerGrad = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, glowR
      );
      outerGrad.addColorStop(0, "rgba(34,211,238,0.25)");
      outerGrad.addColorStop(0.3, "rgba(34,211,238,0.12)");
      outerGrad.addColorStop(0.7, "rgba(34,211,238,0.03)");
      outerGrad.addColorStop(1, "rgba(34,211,238,0)");
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, glowR, 0, Math.PI * 2);
      ctx.fillStyle = outerGrad;
      ctx.fill();

      // Inner bright ring
      const innerGrad = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, 18
      );
      innerGrad.addColorStop(0, "rgba(34,211,238,0.6)");
      innerGrad.addColorStop(0.4, "rgba(34,211,238,0.3)");
      innerGrad.addColorStop(0.8, "rgba(34,211,238,0.08)");
      innerGrad.addColorStop(1, "rgba(34,211,238,0)");
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = innerGrad;
      ctx.fill();

      // Bright core dot
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();

      // Neon cyan ring outline
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(34,211,238,${0.5 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Size canvas to parent container
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Populate particles
    const parent = canvas.parentElement;
    const rect = parent?.getBoundingClientRect();
    const W = rect?.width ?? window.innerWidth;
    const H = rect?.height ?? window.innerHeight;
    const area = W * H;
    const count = Math.min(
      Math.round((area / 1000000) * PARTICLE_COUNT_BASE),
      PARTICLE_COUNT_MAX
    );
    particlesRef.current = Array.from({ length: count }, () =>
      createParticle(W, H)
    );

    // Mouse tracking
    const onMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - r.left;
      mouseRef.current.y = e.clientY - r.top;
    };
    const onMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    rafRef.current = requestAnimationFrame(animate);

    // Pause animation when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [animate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ willChange: "transform", pointerEvents: "auto" }}
      />
      {/* Top fade: solid black at top → transparent below navbar */}
      <div
        className="absolute top-0 left-0 w-full h-40 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.7) 40%, transparent 100%)",
        }}
      />
    </motion.div>
  );
}
