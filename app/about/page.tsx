"use client";

import { motion } from "framer-motion";
import {
  Atom,
  Eye,
  Zap,
  Globe,
  BookOpen,
  Rocket,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

// ── Animation Wrappers ─────────────────────────────────────────

function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        visible: { transition: { staggerChildren: 0.1 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// ── Data ───────────────────────────────────────────────────────

const features = [
  {
    icon: <Atom className="w-6 h-6" />,
    title: "Interactive 3D Simulations",
    description:
      "Explore quantum phenomena through handcrafted Three.js visualizations. Drag to orbit, click to measure, and watch superposition collapse in real time.",
    color: "#8b5cf6",
  },

  {
    icon: <Eye className="w-6 h-6" />,
    title: "Scrollytelling Experience",
    description:
      "Immersive scroll-driven narratives that guide you through each concept, seamlessly transitioning between 2D simulations and 3D interactive showcases.",
    color: "#ec4899",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Structured Learning Paths",
    description:
      "Nine core topics covering the essential pillars of quantum mechanics, each with curated content, key concepts, and real-world examples.",
    color: "#10b981",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Real-Time Particle Physics",
    description:
      "The homepage background uses spatial-hashed particle physics with mouse interaction, entanglement beams, and wave connections — a quantum metaphor made visible.",
    color: "#f59e0b",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Accessible to Everyone",
    description:
      "No physics degree required. We break down complex quantum concepts into intuitive explanations with analogies, visuals, and progressive depth.",
    color: "#6366f1",
  },
];

const topics = [
  { slug: "superposition", title: "Superposition", icon: "⚛️" },
  { slug: "quantum-entanglement", title: "Entanglement", icon: "🔗" },
  { slug: "wave-particle-duality", title: "Wave-Particle Duality", icon: "🌊" },
  { slug: "quantum-computing", title: "Quantum Computing", icon: "💻" },
  { slug: "quantum-tunneling", title: "Quantum Tunneling", icon: "🔄" },
  { slug: "observer-effect", title: "Observer Effect", icon: "👁️" },
  { slug: "quantum-tools", title: "Quantum Tools", icon: "🛠️" },
  { slug: "wave-function", title: "Wave Function", icon: "📊" },
  { slug: "schrodingers-cat", title: "Schrödinger's Cat", icon: "🐱" },
];

const techStack = [
  { name: "Next.js 16", role: "React Framework", color: "#ffffff" },
  { name: "React 19", role: "UI Library", color: "#61dafb" },
  { name: "Three.js", role: "3D Graphics", color: "#049ef4" },
  { name: "Framer Motion", role: "Animations", color: "#bb4bff" },
  { name: "Tailwind CSS", role: "Styling", color: "#06b6d4" },

  { name: "TypeScript", role: "Type Safety", color: "#3178c6" },
];

const timeline = [
  {
    step: "01",
    title: "Choose a Topic",
    description: "Browse nine quantum physics topics, each with interactive simulations and structured content.",
  },
  {
    step: "02",
    title: "Explore Visually",
    description: "Immerse yourself in 3D interactive showcases — drag, click, and observe quantum phenomena come alive.",
  },
  {
    step: "03",
    title: "Learn the Science",
    description: "Read curated explanations that build from fundamentals to advanced concepts at your own pace.",
  },
  {
    step: "04",
    title: "Ask the AI",
    description: "Explore interactive 3D simulations to see quantum phenomena come alive.",
  },
];

// ── Page ───────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* ── Mission Section ─────────────────────────────────── */}
      <section className="relative py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span
                  className="text-sm font-medium text-purple-400 tracking-wider uppercase mb-4 block"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Our Mission
                </span>
                <h2
                  className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  Quantum physics shouldn&apos;t be
                  <span className="text-purple-400"> intimidating</span>
                </h2>
                <p
                  className="text-gray-400 text-lg leading-relaxed mb-6"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  For too long, quantum mechanics has been locked behind dense
                  textbooks and impenetrable math. We believe everyone deserves
                  to understand the bizarre, beautiful rules that govern our
                  universe at its smallest scale.
                </p>
                <p
                  className="text-gray-500 leading-relaxed"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Quantum: The Easy Way combines interactive 3D visualizations,
                  scroll-driven storytelling, and AI-powered explanations to
                  create a learning experience that&apos;s as engaging as it is
                  educational. Whether you&apos;re a curious student, an
                  educator, or just someone who wonders how the universe works —
                  this platform is for you.
                </p>
              </div>

              {/* Stats card */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { number: "9", label: "Core Topics", color: "rgba(139,92,246,0.15)" },
                  { number: "9", label: "3D Showcases", color: "rgba(6,182,212,0.15)" },
                  { number: "∞", label: "AI Questions", color: "rgba(236,72,153,0.15)" },
                  { number: "0", label: "Prerequisites", color: "rgba(16,185,129,0.15)" },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    whileHover={{ scale: 1.03, y: -2 }}
                    className="rounded-2xl p-6 border border-white/10 text-center"
                    style={{ backgroundColor: stat.color }}
                  >
                    <div
                      className="text-4xl font-bold text-white mb-1"
                      style={{ fontFamily: "var(--font-playfair)" }}
                    >
                      {stat.number}
                    </div>
                    <div
                      className="text-sm text-gray-400"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────── */}
      <section className="relative py-28 px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <span
              className="text-sm font-medium text-cyan-400 tracking-wider uppercase mb-4 block"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              How It Works
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Your learning <span className="text-cyan-400">journey</span>
            </h2>
          </ScrollReveal>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/30 via-cyan-500/30 to-pink-500/30" />

            <StaggerContainer className="space-y-12 md:space-y-0">
              {timeline.map((item, i) => (
                <motion.div
                  key={item.step}
                  variants={cardVariant}
                  className={`relative md:flex items-center gap-12 ${
                    i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  } md:mb-16`}
                >
                  {/* Content card */}
                  <div className="md:w-1/2">
                    <div
                      className="p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-colors"
                      style={{
                        background: `linear-gradient(135deg, rgba(139,92,246,0.05) 0%, rgba(6,182,212,0.05) 100%)`,
                      }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                          <span
                            className="text-sm font-bold text-purple-400"
                            style={{ fontFamily: "var(--font-dm-sans)" }}
                          >
                            {item.step}
                          </span>
                        </div>
                        <h3
                          className="text-xl font-bold"
                          style={{ fontFamily: "var(--font-playfair)" }}
                        >
                          {item.title}
                        </h3>
                      </div>
                      <p
                        className="text-gray-400 leading-relaxed"
                        style={{ fontFamily: "var(--font-dm-sans)" }}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Center dot */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-500 border-4 border-black z-10" />

                  {/* Spacer */}
                  <div className="md:w-1/2" />
                </motion.div>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────────── */}
      <section className="relative py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <span
              className="text-sm font-medium text-pink-400 tracking-wider uppercase mb-4 block"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Features
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Everything you need to{" "}
              <span className="text-pink-400">explore quantum</span>
            </h2>
          </ScrollReveal>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={cardVariant}
                whileHover={{ y: -4, borderColor: `${feature.color}40` }}
                className="p-7 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors group-hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: `${feature.color}15`,
                    border: `1px solid ${feature.color}30`,
                    color: feature.color,
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-gray-400 text-sm leading-relaxed"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Topics Overview ─────────────────────────────────── */}
      <section className="relative py-28 px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <span
              className="text-sm font-medium text-emerald-400 tracking-wider uppercase mb-4 block"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Curriculum
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Nine pillars of{" "}
              <span className="text-emerald-400">quantum physics</span>
            </h2>
            <p
              className="text-gray-400 mt-4 max-w-2xl mx-auto"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Each topic features interactive 3D simulations, structured
              explanations, and key concepts to deepen your understanding.
            </p>
          </ScrollReveal>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic) => (
              <motion.div key={topic.slug} variants={cardVariant}>
                <Link href={`/topics/${topic.slug}`} className="block">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-4 p-5 rounded-xl border border-white/10 hover:border-emerald-500/30 bg-white/[0.02] hover:bg-emerald-500/5 transition-all cursor-pointer group"
                  >
                    <span className="text-2xl">{topic.icon}</span>
                    <div className="flex-1">
                      <h4
                        className="font-semibold text-sm group-hover:text-emerald-400 transition-colors"
                        style={{ fontFamily: "var(--font-playfair)" }}
                      >
                        {topic.title}
                      </h4>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 transition-colors" />
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Tech Stack ──────────────────────────────────────── */}
      <section className="relative py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <span
              className="text-sm font-medium text-cyan-400 tracking-wider uppercase mb-4 block"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Built With
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Powered by{" "}
              <span className="text-cyan-400">modern tech</span>
            </h2>
          </ScrollReveal>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {techStack.map((tech) => (
              <motion.div
                key={tech.name}
                variants={cardVariant}
                whileHover={{ scale: 1.04, y: -3 }}
                className="p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center group"
              >
                <div
                  className="text-lg font-bold mb-1 group-hover:scale-105 transition-transform"
                  style={{
                    fontFamily: "var(--font-playfair)",
                    color: tech.color,
                  }}
                >
                  {tech.name}
                </div>
                <div
                  className="text-xs text-gray-500"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {tech.role}
                </div>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="relative py-32 px-6 overflow-hidden">
        {/* Gradient bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 80%, rgba(139,92,246,0.15) 0%, transparent 60%)",
          }}
        />

        <ScrollReveal className="relative z-10 text-center max-w-3xl mx-auto">
          <Rocket className="w-10 h-10 text-purple-400 mx-auto mb-6" />
          <h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Ready to explore the{" "}
            <span className="text-purple-400">quantum world</span>?
          </h2>
          <p
            className="text-gray-400 text-lg mb-10 max-w-xl mx-auto"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Dive into nine interactive topics, play with 3D simulations, and
            ask our AI tutor anything. Your quantum journey starts now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/?open-topics=true">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-4 rounded-full bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/25 flex items-center gap-2"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Begin Your Journey
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>

          </div>
        </ScrollReveal>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="relative py-8 px-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p
            className="text-gray-500 text-sm"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            © 2026 Quantum: The Easy Way. All rights reserved.
          </p>
          <div className="flex gap-4">
            {["GitHub", "Twitter", "Discord"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-gray-500 text-sm hover:text-purple-400 transition-colors"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
