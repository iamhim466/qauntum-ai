"use client";

import { useEffect, useRef } from "react";
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
const OBSERVER_THRESHOLD = 180;
const PARTICLE_MIN_R = 1.5;
const PARTICLE_MAX_R = 4.5;
const PARTICLE_COUNT_BASE = 300;
const WAVE_AMPLITUDE = 2;
const WAVE_K = 0.08;
const WAVE_OMEGA = 0.04;
const ENTANGLEMENT_INTERVAL = 2500;
const ENTANGLEMENT_DECAY_SPEED = 0.012;
const BREATH_CYCLE_SEC = 34; // 17s repel + 17s attract per full cycle

// ── Helpers ────────────────────────────────────────────────────

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function distance(a: Particle, b: Particle) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function createParticle(w: number, h: number): Particle {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const r = randomBetween(PARTICLE_MIN_R, PARTICLE_MAX_R);
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: randomBetween(-1.2, 1.2),
    vy: randomBetween(-1.2, 1.2),
    r,
    baseR: r,
    color,
  };
}

// ── Component ──────────────────────────────────────────────────

export default function QuantumBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const entanglementsRef = useRef<Entanglement[]>([]);
  const rafRef = useRef<number>(0);
  const lastEntanglementRef = useRef(0);

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

    // ── Populate particles ─────────────────────────────────────
    const parent = canvas.parentElement;
    const rect = parent?.getBoundingClientRect();
    const W = rect?.width ?? window.innerWidth;
    const H = rect?.height ?? window.innerHeight;
    const area = W * H;
    const count = Math.min(
      Math.round((area / 1200000) * PARTICLE_COUNT_BASE),
      400
    );
    particlesRef.current = Array.from({ length: count }, () =>
      createParticle(W, H)
    );

    // ── Mouse tracking (relative to canvas container) ──────────
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

    // ── Animation loop ─────────────────────────────────────────
    const animate = (timestamp: number) => {
      const parentEl = canvas.parentElement;
      const bounds = parentEl?.getBoundingClientRect();
      const cW = bounds?.width ?? window.innerWidth;
      const cH = bounds?.height ?? window.innerHeight;
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

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

      // Additive blending
      ctx.globalCompositeOperation = "lighter";

      // ── Update & draw particles ──────────────────────────────
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Observer effect
        const mdx = mouse.x - p.x;
        const mdy = mouse.y - p.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mDist < OBSERVER_THRESHOLD && mDist > 1) {
          const strength =
            ((OBSERVER_THRESHOLD - mDist) / OBSERVER_THRESHOLD) * 0.012;
          p.vx += (mdx / mDist) * strength;
          p.vy += (mdy / mDist) * strength;
          p.r += (p.baseR + 1.2 - p.r) * 0.08;
        } else {
          p.r += (p.baseR - p.r) * 0.08;
        }

        // Breathing cycle: sinusoidal repel ↔ attract over BREATH_CYCLE_SEC
        const breathPhase = Math.sin((timestamp / 1000 / BREATH_CYCLE_SEC) * Math.PI * 2);
        // breathPhase ∈ [-1, +1]: -1 = full repel, +1 = full attract
        const breathStrength = 0.008 * Math.abs(breathPhase);
        const isRepelling = breathPhase < 0;

        for (let j = 0; j < particles.length; j++) {
          if (i === j) continue;
          const other = particles[j];
          const dx = other.x - p.x;
          const dy = other.y - p.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < WAVE_THRESHOLD && d > 5) {
            // Hard repel when particles are overlapping
            if (d < 12) {
              const repel = 0.08 * (1 - d / 12);
              p.vx -= (dx / d) * repel;
              p.vy -= (dy / d) * repel;
            } else if (isRepelling) {
              // Repulsion phase — push apart
              p.vx -= (dx / d) * breathStrength;
              p.vy -= (dy / d) * breathStrength;
            } else {
              // Attraction phase — pull together
              p.vx += (dx / d) * breathStrength;
              p.vy += (dy / d) * breathStrength;
            }
          }
        }

        // Subtle random turbulence
        p.vx += (Math.random() - 0.5) * 0.08;
        p.vy += (Math.random() - 0.5) * 0.08;

        // Damping
        p.vx *= 0.997;
        p.vy *= 0.997;

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        else if (p.x > cW) { p.x = cW; p.vx = -Math.abs(p.vx); }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
        else if (p.y > cH) { p.y = cH; p.vy = -Math.abs(p.vy); }

        // Subtle glow for visibility
        ctx.shadowBlur = 4;
        ctx.shadowColor = p.color;

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Reset shadow for next draws
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      }

      // ── Visible connecting lines ─────────────────────────────
      ctx.lineWidth = 0.75;
      const time = timestamp * 0.001;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const d = distance(particles[i], particles[j]);
          if (d > WAVE_THRESHOLD) continue;

          const alpha = (1 - d / WAVE_THRESHOLD) * 0.25;
          ctx.strokeStyle = `rgba(0,243,255,${alpha})`;
          ctx.beginPath();

          const ax = particles[i].x;
          const ay = particles[i].y;
          const bx = particles[j].x;
          const by = particles[j].y;

          const dx = bx - ax;
          const dy = by - ay;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;

          const segments = 10;
          for (let s = 0; s <= segments; s++) {
            const t = s / segments;
            const lx = ax + dx * t;
            const ly = ay + dy * t;

            const waveOffset =
              Math.sin(WAVE_K * t * d - WAVE_OMEGA * time) * WAVE_AMPLITUDE;
            const px = lx + nx * waveOffset;
            const py = ly + ny * waveOffset;

            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
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

        const pA = particles[e.a];
        const pB = particles[e.b];
        if (!pA || !pB) continue;

        const intensity = Math.sin(e.progress * Math.PI);
        const alpha = intensity * 0.7;

        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(168,85,247,${alpha})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(168,85,247,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
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
