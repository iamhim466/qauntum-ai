"use client";

import { useRef, ReactNode } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { MousePointerClick, Sparkles, Zap } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

interface ScrollytellingViewportProps {
  /** Model 1: renders during scroll 0%–45% (e.g. 2D canvas simulation) */
  model1: ReactNode;
  /** Model 2: renders during scroll 55%–100% (e.g. 3D showcase) */
  model2: ReactNode;
  /** Card 01: fades out during scroll 30%–50% */
  card1Title: string;
  card1Content: string;
  /** Card 02: fades in during scroll 40%–60% */
  card2Title: string;
  card2Content: string;
  /** Accent color (e.g. "#c4b5fd") */
  accentColor: string;
  /** RGB triplet (e.g. "139,92,246") */
  colorRgb: string;
}

// ── Floating Glassmorphism Card ────────────────────────────────

function FloatingCard({
  title,
  content,
  opacity,
  position,
  accentColor,
  colorRgb,
}: {
  title: string;
  content: string;
  opacity: MotionValue<number>;
  position: "right" | "left";
  accentColor: string;
  colorRgb: string;
}) {
  return (
    <motion.div
      style={{ opacity }}
      className={`absolute top-1/2 -translate-y-1/2 max-w-sm md:max-w-md pointer-events-auto ${
        position === "right" ? "right-6 md:right-12" : "left-6 md:left-12"
      }`}
    >
      <div
        className="p-6 md:p-8 rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: "rgba(9, 9, 11, 0.7)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderColor: `rgba(${colorRgb},0.3)`,
          boxShadow: `0 0 40px rgba(${colorRgb},0.15), 0 25px 50px rgba(0,0,0,0.5)`,
        }}
      >
        <div
          className="w-10 h-1 rounded-full mb-4"
          style={{
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          }}
        />
        <h3
          className="text-xl md:text-2xl font-bold mb-3 text-white"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          {title}
        </h3>
        <p
          className="text-sm md:text-base text-gray-300 leading-relaxed"
          style={{ fontFamily: "var(--font-dm-sans)" }}
        >
          {content}
        </p>
      </div>
    </motion.div>
  );
}

// ── Bottom Helper Pills ────────────────────────────────────────

function HelperPills({ colorRgb }: { colorRgb: string }) {
  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-5 py-2.5 rounded-full text-xs font-medium text-purple-200 shadow-lg pointer-events-none select-none"
      style={{
        backgroundColor: "rgba(24, 24, 27, 0.8)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid rgba(${colorRgb},0.3)`,
        boxShadow: `0 0 20px rgba(${colorRgb},0.1)`,
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      <MousePointerClick className="w-4 h-4 opacity-70" />
      <span>Drag to move</span>
      <span
        className="w-1 h-1 rounded-full"
        style={{ backgroundColor: `rgba(${colorRgb},0.5)` }}
      />
      <Sparkles className="w-4 h-4 opacity-70" />
      <span>Click to see function</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function ScrollytellingViewport({
  model1,
  model2,
  card1Title,
  card1Content,
  card2Title,
  card2Content,
  accentColor,
  colorRgb,
}: ScrollytellingViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // ── Model cross-fade ──────────────────────────────────────
  // 0%–45%: Model #1 at full opacity
  // 45%–55%: Cross-fade transition
  // 55%–100%: Model #2 at full opacity
  const model1Opacity = useTransform(
    scrollYProgress,
    [0, 0.4, 0.55, 1],
    [1, 1, 0, 0]
  );
  const model2Opacity = useTransform(
    scrollYProgress,
    [0, 0.4, 0.55, 1],
    [0, 0, 1, 1]
  );

  // ── Card opacity ──────────────────────────────────────────
  // Card 01 fades out during 25%–50%
  const card1Opacity = useTransform(
    scrollYProgress,
    [0, 0.05, 0.25, 0.5],
    [0, 1, 1, 0]
  );
  // Card 02 fades in during 50%–75%
  const card2Opacity = useTransform(
    scrollYProgress,
    [0.5, 0.75, 0.95],
    [0, 1, 1]
  );

  // ── Scroll progress indicator ─────────────────────────────
  const progressWidth = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "100%"]
  );

  return (
    <>
      {/* Tall scroll track */}
      <div ref={containerRef} className="relative h-[250vh] w-full">
        {/* Sticky viewport */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* ── Background canvas layer (z-0) ──────────────── */}
          <div className="absolute inset-0 z-0">
            {/* Model #1 (2D Canvas) — centered left */}
            <motion.div
              className="absolute inset-0"
              style={{ opacity: model1Opacity }}
            >
              <div className="absolute inset-0 -translate-x-[20%] scale-[0.85]">
                {model1}
              </div>
            </motion.div>

            {/* Model #2 (3D Showcase) — centered right */}
            <motion.div
              className="absolute inset-0"
              style={{ opacity: model2Opacity }}
            >
              <div className="absolute inset-0 translate-x-[20%] scale-[0.85]">
                {model2}
              </div>
            </motion.div>

            {/* Vignette overlay for depth */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
              }}
            />
          </div>

          {/* ── Floating foreground overlay cards (z-10) ───── */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            <FloatingCard
              title={card1Title}
              content={card1Content}
              opacity={card1Opacity}
              position="right"
              accentColor={accentColor}
              colorRgb={colorRgb}
            />
            <FloatingCard
              title={card2Title}
              content={card2Content}
              opacity={card2Opacity}
              position="left"
              accentColor={accentColor}
              colorRgb={colorRgb}
            />
          </div>

          {/* ── Scroll progress bar ────────────────────────── */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] z-15 bg-white/5">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: progressWidth,
                background: `linear-gradient(90deg, rgba(${colorRgb},0.8), ${accentColor})`,
                boxShadow: `0 0 12px rgba(${colorRgb},0.5)`,
              }}
            />
          </div>

          {/* ── Bottom helper pills ────────────────────────── */}
          <HelperPills colorRgb={colorRgb} />
        </div>
      </div>
    </>
  );
}
