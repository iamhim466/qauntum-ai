"use client";

import { useEffect, useRef, useCallback } from "react";

interface TopicSimulationProps {
  slug: string;
  color: string;
  colorRgb: string;
}

// ── Simulation: Superposition (oscillating probability waves) ──
function drawSuperposition(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  colorRgb: string
) {
  ctx.clearRect(0, 0, w, h);

  // Two overlapping probability waves
  for (let wave = 0; wave < 2; wave++) {
    const offset = wave * Math.PI;
    const amp = h * 0.15;
    const freq = 0.02 + wave * 0.005;
    const alpha = 0.6 - wave * 0.2;

    ctx.beginPath();
    ctx.strokeStyle = `rgba(${colorRgb},${alpha})`;
    ctx.lineWidth = 3;
    for (let x = 0; x < w; x++) {
      const y =
        h / 2 +
        Math.sin(x * freq + time * 2 + offset) * amp +
        Math.sin(x * freq * 1.5 + time * 3) * amp * 0.3;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Measurement point
  const measureX = w * 0.7;
  const measureY = h / 2 + Math.sin(measureX * 0.02 + time * 2) * h * 0.15;
  ctx.beginPath();
  ctx.arc(measureX, measureY, 8, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,0.9)`;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(measureX, measureY, 12, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${colorRgb},0.6)`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ── Simulation: Entanglement (connected particles) ─────────────
function drawEntanglement(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  colorRgb: string
) {
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.3;

  // Two orbiting particles
  const angle1 = time * 1.5;
  const angle2 = angle1 + Math.PI;
  const p1x = cx + Math.cos(angle1) * radius;
  const p1y = cy + Math.sin(angle1) * radius * 0.5;
  const p2x = cx + Math.cos(angle2) * radius;
  const p2y = cy + Math.sin(angle2) * radius * 0.5;

  // Connection line
  ctx.beginPath();
  ctx.moveTo(p1x, p1y);
  ctx.lineTo(p2x, p2y);
  ctx.strokeStyle = `rgba(${colorRgb},0.3)`;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Pulse along the line
  const pulseT = (time * 2) % 1;
  const pulseX = p1x + (p2x - p1x) * pulseT;
  const pulseY = p1y + (p2y - p1y) * pulseT;
  ctx.beginPath();
  ctx.arc(pulseX, pulseY, 4, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,0.8)`;
  ctx.fill();

  // Particles
  [
    [p1x, p1y],
    [p2x, p2y],
  ].forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${colorRgb},0.8)`;
    ctx.fill();

    // Glow ring
    ctx.beginPath();
    ctx.arc(px, py, 20, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${colorRgb},0.3)`;
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Orbital path
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.5, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${colorRgb},0.15)`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ── Simulation: Wave-Particle Duality (double slit) ────────────
function drawWaveParticle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  colorRgb: string
) {
  ctx.clearRect(0, 0, w, h);

  const slitY1 = h * 0.4;
  const slitY2 = h * 0.6;
  const slitX = w * 0.4;
  const screenX = w * 0.85;

  // Barrier
  ctx.fillStyle = `rgba(${colorRgb},0.2)`;
  ctx.fillRect(slitX - 2, 0, 4, slitY1 - 15);
  ctx.fillRect(slitX - 2, slitY1 + 15, 4, slitY2 - slitY1 - 30);
  ctx.fillRect(slitX - 2, slitY2 + 15, 4, h);

  // Slits glow
  ctx.fillStyle = `rgba(${colorRgb},0.6)`;
  ctx.fillRect(slitX - 1, slitY1 - 12, 2, 24);
  ctx.fillRect(slitX - 1, slitY2 - 12, 2, 24);

  // Wave fronts from slits
  for (let i = 0; i < 15; i++) {
    const r = ((time * 80 + i * 30) % 300);
    const alpha = Math.max(0, 1 - r / 300) * 0.3;

    [slitY1, slitY2].forEach((sy) => {
      ctx.beginPath();
      ctx.arc(slitX, sy, r, -Math.PI / 3, Math.PI / 3);
      ctx.strokeStyle = `rgba(${colorRgb},${alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  // Interference pattern on screen
  for (let y = 0; y < h; y += 2) {
    const d1 = Math.sqrt((screenX - slitX) ** 2 + (y - slitY1) ** 2);
    const d2 = Math.sqrt((screenX - slitX) ** 2 + (y - slitY2) ** 2);
    const phase = (d1 - d2) * 0.05;
    const intensity = Math.cos(phase) ** 2;
    ctx.fillStyle = `rgba(${colorRgb},${intensity * 0.8})`;
    ctx.fillRect(screenX, y, 4, 2);
  }

  // Incoming particle
  const particleX = (time * 60) % (slitX - 20);
  ctx.beginPath();
  ctx.arc(particleX, h / 2, 5, 0, Math.PI * 2);    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fill();
}

// ── Simulation: Quantum Computing (qubit Bloch sphere) ─────────
function drawQuantumComputing(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  colorRgb: string
) {
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.35;

  // Rotating Bloch sphere outline
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.3, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${colorRgb},0.2)`;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.3, r, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${colorRgb},0.2)`;
  ctx.stroke();

  // Axes
  ctx.beginPath();
  ctx.moveTo(cx, cy - r - 10);
  ctx.lineTo(cx, cy + r + 10);
  ctx.strokeStyle = `rgba(${colorRgb},0.3)`;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - r - 10, cy);
  ctx.lineTo(cx + r + 10, cy);
  ctx.strokeStyle = `rgba(${colorRgb},0.3)`;
  ctx.stroke();

  // Qubit state vector
  const theta = time * 0.8;
  const phi = time * 1.2;
  const qx = r * Math.sin(theta) * Math.cos(phi);
  const qy = -r * Math.cos(theta);
  const qz = r * Math.sin(theta) * Math.sin(phi) * 0.3;

  // Vector line
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + qx, cy + qy);
  ctx.strokeStyle = `rgba(255,255,255,0.8)`;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Qubit point
  ctx.beginPath();
  ctx.arc(cx + qx, cy + qy, 8, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${colorRgb},0.9)`;
  ctx.fill();

  // |0⟩ and |1⟩ labels
  ctx.fillStyle = `rgba(255,255,255,0.6)`;
  ctx.font = "14px var(--font-dm-sans)";
  ctx.textAlign = "center";
  ctx.fillText("|0⟩", cx, cy - r - 18);
  ctx.fillText("|1⟩", cx, cy + r + 24);
}

// ── Simulation: Tunneling (barrier penetration) ────────────────
function drawTunneling(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  colorRgb: string
) {
  ctx.clearRect(0, 0, w, h);

  const cy = h / 2;
  const barrierX = w * 0.45;
  const barrierW = 40;
  const barrierH = h * 0.5;

  // Barrier
  ctx.fillStyle = `rgba(${colorRgb},0.3)`;
  ctx.fillRect(barrierX, cy - barrierH / 2, barrierW, barrierH);
  ctx.strokeStyle = `rgba(${colorRgb},0.5)`;
  ctx.lineWidth = 2;
  ctx.strokeRect(barrierX, cy - barrierH / 2, barrierW, barrierH);

  // Incoming wave
  ctx.beginPath();
  ctx.strokeStyle = `rgba(${colorRgb},0.7)`;
  ctx.lineWidth = 3;
  for (let x = 0; x < barrierX; x++) {
    const y =
      cy + Math.sin(x * 0.04 - time * 3) * 30 * Math.min(1, (barrierX - x) / 50 + 0.3);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Decaying wave inside barrier
  ctx.beginPath();
  ctx.strokeStyle = `rgba(${colorRgb},0.4)`;
  ctx.lineWidth = 2;
  for (let x = 0; x < barrierW; x++) {
    const decay = Math.exp(-x * 0.08);
    const y = cy + Math.sin(x * 0.1 - time * 3) * 30 * decay;
    if (x === 0) ctx.moveTo(barrierX + x, y);
    else ctx.lineTo(barrierX + x, y);
  }
  ctx.stroke();

  // Transmitted wave (smaller)
  ctx.beginPath();
  ctx.strokeStyle = `rgba(${colorRgb},0.5)`;
  ctx.lineWidth = 2;
  for (let x = barrierW; x < w - barrierX; x++) {
    const amplitude = 30 * Math.exp(-barrierW * 0.08);
    const y = cy + Math.sin(x * 0.04 - time * 3) * amplitude;
    if (x === barrierW) ctx.moveTo(barrierX + x, y);
    else ctx.lineTo(barrierX + x, y);
  }
  ctx.stroke();

  // Particle
  const particlePhase = (time * 3) % (w * 0.04);
  const particleX = (particlePhase / (w * 0.04)) * w;
  ctx.beginPath();
  ctx.arc(particleX, cy, 6, 0, Math.PI * 2);    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fill();

  // Labels
  ctx.fillStyle = `rgba(255,255,255,0.5)`;
  ctx.font = "11px var(--font-dm-sans)";
  ctx.textAlign = "center";
  ctx.fillText("Incident", w * 0.2, cy - 50);
  ctx.fillText("Barrier", barrierX + barrierW / 2, cy - barrierH / 2 - 10);
  ctx.fillText("Transmitted", w * 0.75, cy - 50);
}

// ── Simulation: Observer Effect (measurement collapse) ──────────
function drawObserverEffect(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  colorRgb: string
) {
  ctx.clearRect(0, 0, w, h);

  const cy = h / 2;
  const measureCycle = 4; // seconds per cycle
  const phase = (time % measureCycle) / measureCycle;
  const isCollapsed = phase > 0.7;

  // Superposition wave (before measurement)
  if (!isCollapsed) {
    const collapseProgress = phase < 0.5 ? 1 : 1 - (phase - 0.5) / 0.2;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${colorRgb},${0.6 * collapseProgress})`;
    ctx.lineWidth = 3;
    for (let x = 0; x < w; x++) {
      const amp = 40 * collapseProgress;
      const y = cy + Math.sin(x * 0.03 + time * 2) * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Collapsed state (after measurement)
  if (isCollapsed) {
    const appearProgress = (phase - 0.7) / 0.3;
    ctx.beginPath();
    ctx.arc(w / 2, cy, 15 * appearProgress, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${colorRgb},${0.9 * appearProgress})`;
    ctx.fill();

    // Measurement flash
    ctx.beginPath();
    ctx.arc(w / 2, cy, 30 * appearProgress, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.3 * appearProgress})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Eye icon (observer)
  const eyeX = w / 2;
  const eyeY = 40;
  ctx.beginPath();
  ctx.ellipse(eyeX, eyeY, 20, 12, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,255,255,0.5)`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, 5, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,0.7)`;
  ctx.fill();

  // Measurement line
  ctx.beginPath();
  ctx.moveTo(eyeX, eyeY + 12);
  ctx.lineTo(w / 2, cy - 50);
  ctx.strokeStyle = `rgba(255,255,255,${isCollapsed ? 0.4 : 0.1})`;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Status text
  ctx.fillStyle = `rgba(255,255,255,0.6)`;
  ctx.font = "12px var(--font-dm-sans)";
  ctx.textAlign = "center";
  ctx.fillText(isCollapsed ? "Measured — State Collapsed" : "Superposition — Multiple States", w / 2, h - 20);
}

// ── Simulation: Quantum Tools (circuit diagram) ────────────────
function drawQuantumTools(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  colorRgb: string
) {
  ctx.clearRect(0, 0, w, h);

  const qubitY = [h * 0.3, h * 0.5, h * 0.7];
  const gates: { type: string; x: number; q: number; target?: number }[] = [
    { type: "H", x: w * 0.15, q: 0 },
    { type: "X", x: w * 0.3, q: 1 },
    { type: "CNOT", x: w * 0.45, q: 0, target: 1 },
    { type: "H", x: w * 0.6, q: 2 },
    { type: "Z", x: w * 0.75, q: 1 },
  ];

  // Qubit lines
  qubitY.forEach((y, i) => {
    ctx.beginPath();
    ctx.moveTo(w * 0.05, y);
    ctx.lineTo(w * 0.9, y);
    ctx.strokeStyle = `rgba(${colorRgb},0.3)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = `rgba(255,255,255,0.5)`;
    ctx.font = "12px var(--font-dm-sans)";
    ctx.textAlign = "right";
    ctx.fillText(`q${i}`, w * 0.03, y + 4);
  });

  // Gates
  gates.forEach((gate, i) => {
    const y = qubitY[gate.q];
    const appear = Math.min(1, Math.max(0, (time * 2 - i * 0.5)));
    if (appear <= 0) return;

    const size = 30 * appear;

    if (gate.type === "CNOT" && gate.target !== undefined) {
      const targetY = qubitY[gate.target];
      // Control dot
      ctx.beginPath();
      ctx.arc(gate.x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${colorRgb},0.9)`;
      ctx.fill();

      // Connection line
      ctx.beginPath();
      ctx.moveTo(gate.x, y);
      ctx.lineTo(gate.x, targetY);
      ctx.strokeStyle = `rgba(${colorRgb},0.6)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Target circle
      ctx.beginPath();
      ctx.arc(gate.x, targetY, 12, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${colorRgb},0.8)`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gate.x - 12, targetY);
      ctx.lineTo(gate.x + 12, targetY);
      ctx.moveTo(gate.x, targetY - 12);
      ctx.lineTo(gate.x, targetY + 12);
      ctx.stroke();
    } else {
      // Gate box
      ctx.fillStyle = `rgba(${colorRgb},0.3)`;
      ctx.strokeStyle = `rgba(${colorRgb},0.7)`;
      ctx.lineWidth = 2;
      ctx.fillRect(gate.x - size / 2, y - size / 2, size, size);
      ctx.strokeRect(gate.x - size / 2, y - size / 2, size, size);

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = `bold ${14 * appear}px var(--font-dm-sans)`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(gate.type, gate.x, y);
    }
  });
}

// ── Simulation: Wave Function (probability distribution) ───────
function drawWaveFunction(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  colorRgb: string
) {
  ctx.clearRect(0, 0, w, h);

  const cy = h / 2;

  // Wave function ψ (real part)
  ctx.beginPath();
  ctx.strokeStyle = `rgba(${colorRgb},0.7)`;
  ctx.lineWidth = 3;
  for (let x = 0; x < w; x++) {
    const gaussian = Math.exp(-((x - w / 2) ** 2) / (2 * (w * 0.15) ** 2));
    const y = cy + Math.sin(x * 0.02 + time * 2) * 40 * gaussian;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // |ψ|² probability density (filled)
  ctx.beginPath();
  ctx.moveTo(0, cy);
  for (let x = 0; x < w; x++) {
    const gaussian = Math.exp(-((x - w / 2) ** 2) / (2 * (w * 0.12) ** 2));
    const amplitude = Math.sin(x * 0.02 + time * 2) * gaussian;
    const prob = amplitude ** 2;
    const y = cy - prob * 80;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, cy);
  ctx.closePath();
  ctx.fillStyle = `rgba(${colorRgb},0.2)`;
  ctx.fill();
  ctx.strokeStyle = `rgba(${colorRgb},0.4)`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Labels
  ctx.fillStyle = `rgba(255,255,255,0.5)`;
  ctx.font = "12px var(--font-dm-sans)";
  ctx.textAlign = "left";
  ctx.fillText("ψ (wave function)", 10, 30);
  ctx.fillText("|ψ|² (probability)", 10, 50);
}

// ── Simulation: Schrödinger's Cat (box animation) ──────────────
function drawSchrodingersCat(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  colorRgb: string
) {
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const boxSize = Math.min(w, h) * 0.4;
  const boxX = cx - boxSize / 2;
  const boxY = cy - boxSize / 2;

  // Box
  ctx.fillStyle = `rgba(${colorRgb},0.1)`;
  ctx.strokeStyle = `rgba(${colorRgb},0.5)`;
  ctx.lineWidth = 3;
  ctx.fillRect(boxX, boxY, boxSize, boxSize);
  ctx.strokeRect(boxX, boxY, boxSize, boxSize);

  // Question mark inside (superposition)
  const pulse = Math.sin(time * 2) * 0.2 + 0.8;
  ctx.fillStyle = `rgba(255,255,255,${0.3 * pulse})`;
  ctx.font = `bold ${boxSize * 0.3}px var(--font-playfair)`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", cx, cy);

  // Radioactive atom (small orbiting dot)
  const atomAngle = time * 3;
  const atomR = boxSize * 0.15;
  const atomX = cx + Math.cos(atomAngle) * atomR;
  const atomY = cy - boxSize * 0.2 + Math.sin(atomAngle) * atomR * 0.5;
  ctx.beginPath();
  ctx.arc(atomX, atomY, 4, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${colorRgb},0.8)`;
  ctx.fill();

  // Cat silhouette (appears based on observation)
  const catOpacity = (Math.sin(time * 0.5) + 1) / 2;
  ctx.fillStyle = `rgba(255,255,255,${0.3 * catOpacity})`;
  ctx.font = `${boxSize * 0.25}px serif`;
  ctx.textAlign = "center";
  ctx.fillText("🐱", cx, cy + boxSize * 0.1);

  // Status labels
  ctx.fillStyle = `rgba(255,255,255,0.5)`;
  ctx.font = "11px var(--font-dm-sans)";
  ctx.textAlign = "center";
  ctx.fillText("Box Sealed — Superposition Active", cx, boxY - 15);

  // Glow effect around box
  ctx.strokeStyle = `rgba(${colorRgb},${0.1 * pulse})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX - 5, boxY - 5, boxSize + 10, boxSize + 10);
}

// ── Main Component ─────────────────────────────────────────────

const simulations: Record<
  string,
  (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number,
    colorRgb: string
  ) => void
> = {
  superposition: drawSuperposition,
  "quantum-entanglement": drawEntanglement,
  "wave-particle-duality": drawWaveParticle,
  "quantum-computing": drawQuantumComputing,
  "quantum-tunneling": drawTunneling,
  "observer-effect": drawObserverEffect,
  "quantum-tools": drawQuantumTools,
  "wave-function": drawWaveFunction,
  "schrodingers-cat": drawSchrodingersCat,
};

export default function TopicSimulation({ slug, color, colorRgb }: TopicSimulationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const visibleRef = useRef(true);

  const draw = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !visibleRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      const w = rect.width;
      const h = rect.height;
      const time = timestamp / 1000;

      const simFn = slug in simulations ? simulations[slug] : null;
      if (simFn) {
        simFn(ctx, w, h, time, colorRgb);
      }

      rafRef.current = requestAnimationFrame(draw);
    },
    [slug, colorRgb]
  );

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    if (canvasRef.current) observer.observe(canvasRef.current);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [draw]);

  return (
    <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-white/10">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          boxShadow: `inset 0 0 60px rgba(${colorRgb},0.15)`,
        }}
      />
    </div>
  );
}
