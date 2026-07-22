"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { ChevronDown, X, Sparkles, Atom, Brain, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import QuantumBackground from "@/components/QuantumBackground";
import Navbar from "@/components/Navbar";

const coreTopics = [
  { slug: "superposition", title: "Superposition", desc: "Particles exist in multiple states simultaneously until measured." },
  { slug: "quantum-entanglement", title: "Quantum Entanglement", desc: "Two particles instantly connected regardless of distance apart." },
  { slug: "wave-particle-duality", title: "Wave Particle Duality", desc: "Light and matter behave as both waves and particles." },
  { slug: "quantum-computing", title: "Quantum Computing", desc: "Harnessing quantum bits to solve complex problems faster." },
  { slug: "quantum-tunneling", title: "Quantum Tunneling", desc: "Particles pass through barriers classical physics forbids." },
  { slug: "observer-effect", title: "The Observer Effect", desc: "Measurement changes the state of a quantum system." },
  { slug: "quantum-tools", title: "Quantum Tools", desc: "Essential instruments and frameworks for quantum research." },
  { slug: "wave-function", title: "Wave Function", desc: "Mathematical description of a quantum system's state." },
  { slug: "schrodingers-cat", title: "Schrödinger's Cat", desc: "Thought experiment illustrating quantum superposition." },
];

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Gemini", href: "/gemini" },
  { label: "Main Topics", href: "/#topics" },
  { label: "About", href: "/about" },
];

// -- Scroll Reveal Wrapper ---------------------------------------

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

// -- Stagger Container -------------------------------------------

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
        visible: { transition: { staggerChildren: 0.12 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const cardVariant = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

// -- Overlay Card Variant (staggered entrance) -------------------

const overlayCardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 20 },
  },
};

// -- Main Page ---------------------------------------------------

export default function Home() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}

function HomeInner() {
  const [isExpanded, setIsExpanded] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Auto-open overlay if URL has ?open-topics=true
  useEffect(() => {
    if (searchParams.get("open-topics") === "true") {
      setIsExpanded(true);
      // Clean up the URL without the query param
      router.replace("/");
    }
  }, [searchParams, router]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (isExpanded) {
      document.body.classList.add("scroll-locked");
    } else {
      document.body.classList.remove("scroll-locked");
    }
    return () => document.body.classList.remove("scroll-locked");
  }, [isExpanded]);

  const { scrollY } = useScroll();

  // Parallax transforms
  const bgY = useTransform(scrollY, [0, 1000], [0, -200]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -60]);

  // Scroll indicator opacity (fades out as user scrolls)
  const scrollIndicatorOpacity = useTransform(scrollY, [0, 150], [1, 0]);
  const scrollIndicatorScale = useTransform(scrollY, [0, 150], [1, 0.8]);



  return (
    <div className="min-h-screen bg-black text-white">
      {/* -- Parallax Background Canvas -------------------------------- */}
      <motion.div
        className="fixed inset-0 z-0"
        style={{ y: bgY }}
      >
        <QuantumBackground />
      </motion.div>

      {/* -- Shared Navbar -------------------------------------------- */}
      <div style={{ opacity: isExpanded ? 0 : 1, pointerEvents: isExpanded ? "none" : "auto", transition: "opacity 0.4s ease" }}>
        <Navbar onMainTopics={() => setIsExpanded(true)} />
      </div>

      {/* -- Content Sections ----------------------------------------- */}
      <div className="relative z-10">
        {/* Hero Section with Parallax */}
        <section className="relative h-screen overflow-hidden flex flex-col items-center justify-center">
          {/* Hero content with parallax fade + float */}
          <motion.div
            animate={{ opacity: isExpanded ? 0 : 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
          <motion.div
            className="relative z-10 flex flex-col items-center text-center px-6"
            style={{ opacity: heroOpacity, y: heroY }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="text-6xl font-extrabold mb-6"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Quantum Physics
              <br />
              <span className="text-purple-400">Simplified</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              className="text-lg text-gray-400 max-w-xl"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Explore the fundamental building blocks of the universe through
              interactive lessons, simulations, and AI-powered explanations.
            </motion.p>

            {/* -- Start Learning Button -------------------- */}
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
            >
              <motion.button
                onClick={() => setIsExpanded(true)}
                className="px-8 py-3 rounded-full border border-purple-500 text-purple-400 font-medium hover:bg-purple-500/10 transition-colors"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Start Learning
              </motion.button>
            </motion.div>
            </motion.div>
          </motion.div>

          {/* Scroll Down Indicator */}
          <motion.div
            animate={{ opacity: isExpanded ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          >
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            style={{ opacity: scrollIndicatorOpacity, scale: scrollIndicatorScale }}
          >
            <span
              className="text-sm text-gray-400 tracking-widest uppercase"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Scroll Down
            </span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            >
              <ChevronDown className="w-6 h-6 text-purple-400" />
            </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* -- Gemini Section ----------------------------------------- */}
        <section className="relative py-32 px-12">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <h2
                className="text-4xl font-bold mb-4 text-center"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Meet <span className="text-purple-400">Gemini</span>
              </h2>
              <p
                className="text-gray-400 text-center max-w-2xl mx-auto mb-16"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Your AI-powered quantum physics tutor. Ask anything, from basic concepts to advanced quantum mechanics, and get clear, accurate explanations.
              </p>
            </ScrollReveal>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Ask Anything",
                  desc: "Type your question and get instant, accurate answers powered by advanced AI.",
                  icon: "💡",
                },
                {
                  title: "Visual Simulations",
                  desc: "See quantum concepts come to life with interactive visualizations.",
                  icon: "🔬",
                },
                {
                  title: "Learn at Your Pace",
                  desc: "From beginner to advanced - explanations adapt to your understanding.",
                  icon: "📈",
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  variants={cardVariant}
                  className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/40 transition-colors group"
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3
                    className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition-colors"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-gray-400 text-sm"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* -- Main Topics Section ------------------------------------ */}
        <section id="topics" className="relative py-32 px-12 bg-black/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <h2
                className="text-4xl font-bold mb-4 text-center"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                Core <span className="text-purple-400">Topics</span>
              </h2>
              <p
                className="text-gray-400 text-center max-w-2xl mx-auto mb-16"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Master the fundamental pillars of quantum physics through structured, interactive lessons.
              </p>
            </ScrollReveal>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Wave-Particle Duality",
                  desc: "Explore how light and matter exhibit both wave and particle properties.",
                  gradient: "from-purple-500/20 to-cyan-500/20",
                },
                {
                  title: "Quantum Superposition",
                  desc: "Understand how particles exist in multiple states simultaneously.",
                  gradient: "from-cyan-500/20 to-purple-500/20",
                },
                {
                  title: "Quantum Entanglement",
                  desc: "Discover the mysterious connection between entangled particles.",
                  gradient: "from-purple-500/20 to-pink-500/20",
                },
                {
                  title: "Schrödinger's Equation",
                  desc: "Dive into the mathematical framework of quantum mechanics.",
                  gradient: "from-pink-500/20 to-cyan-500/20",
                },
              ].map((topic) => (
                <motion.div
                  key={topic.title}
                  variants={cardVariant}
                  className={`bg-gradient-to-br ${topic.gradient} border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-all cursor-pointer group`}
                >
                  <h3
                    className="text-2xl font-bold mb-3 group-hover:text-purple-400 transition-colors"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    {topic.title}
                  </h3>
                  <p
                    className="text-gray-400"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {topic.desc}
                  </p>
                  <div className="mt-4 text-purple-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore topic →
                  </div>
                </motion.div>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* -- About Section ----------------------------------------- */}
        <section className="relative py-32 px-12">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal>
              <h2
                className="text-4xl font-bold mb-6"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                About <span className="text-purple-400">Quantum</span>
              </h2>
              <p
                className="text-gray-400 text-lg leading-relaxed mb-8"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Quantum: The Easy Way is an interactive learning platform designed to make quantum physics
                accessible to everyone. Whether you&apos;re a curious student, a passionate educator, or
                simply someone who wants to understand the universe at its deepest level, our AI-powered
                tools and visual simulations will guide you on your journey.
              </p>
              <p
                className="text-gray-500 text-sm"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Built with Next.js, Framer Motion, and powered by Google Gemini AI.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="mt-12 px-10 py-4 rounded-full bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/25"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Start Learning Now
              </motion.button>
            </ScrollReveal>
          </div>
        </section>

        {/* -- Footer ------------------------------------------------ */}
        <footer className="relative py-8 px-12 border-t border-white/10">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
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

      {/* -- Full-Screen Expansion Overlay ------------------------- */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-gradient-to-br from-purple-950 via-fuchsia-950/60 to-slate-950"
            style={{ overscrollBehavior: "contain" }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 0.5, ease: "easeOut" },
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.35, ease: "easeIn" },
            }}
          >
            {/* Ambient Background Pulse */}
            <motion.div
              className="absolute inset-0 z-0 pointer-events-none"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
              style={{
                background:
                  "radial-gradient(ellipse at 50% 30%, rgba(168,85,247,0.35) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(217,70,239,0.2) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(99,102,241,0.15) 0%, transparent 45%)",
              }}
            />

            {/* ── Compact Navbar inside overlay ──────────────────── */}
            <motion.header
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed top-0 left-0 right-0 z-[110] px-6 pt-3 pb-2"
            >
              <div
                className="mx-auto max-w-5xl flex justify-between items-center rounded-xl px-5 py-2"
                style={{
                  background: "rgba(0, 20, 30, 0.55)",
                  backdropFilter: "blur(16px) saturate(180%)",
                  WebkitBackdropFilter: "blur(16px) saturate(180%)",
                  border: "1px solid rgba(34, 211, 238, 0.2)",
                  boxShadow: "0 0 12px rgba(34, 211, 238, 0.1), 0 4px 20px rgba(0,0,0,0.3)",
                }}
              >
                {/* Logo Group - Left */}
                <Link href="/" className="flex items-baseline">
                  <span
                    className="text-base font-extrabold tracking-tight"
                    style={{
                      fontFamily: "var(--font-playfair)",
                      color: "white",
                      textShadow: "0 0 16px rgba(34, 211, 238, 0.3)",
                    }}
                  >
                    Quantum
                  </span>
                  <span
                    className="whitespace-nowrap font-bold tracking-normal ml-1.5 text-sm"
                    style={{
                      fontFamily: "var(--font-great-vibes)",
                      color: "#a855f7",
                      textShadow: "0 0 12px rgba(168, 85, 247, 0.5)",
                    }}
                  >
                    The Easy Way
                  </span>
                </Link>

                {/* Navigation - Right */}
                <nav
                  className="flex gap-0.5 items-center whitespace-nowrap"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={(e) => {
                        if (link.href === "/#topics") {
                          e.preventDefault();
                          setIsExpanded(false);
                          setTimeout(() => {
                            document.getElementById("topics")?.scrollIntoView({ behavior: "smooth" });
                          }, 100);
                        } else if (link.href === "/") {
                          setIsExpanded(false);
                        }
                      }}
                      className="relative px-3 py-1.5 text-xs font-medium text-white/70 rounded-full transition-all duration-300 hover:text-white hover:bg-white/10"
                    >
                      {link.label}
                    </Link>
                  ))}
                  {/* Close button as nav item */}
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="ml-1 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </nav>
              </div>

              {/* Animated glow bar */}
              <motion.div
                className="mx-auto max-w-5xl h-px mt-1 rounded-full overflow-hidden"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
                style={{
                  background: "linear-gradient(90deg, transparent 0%, #22d3ee 30%, #67e8f9 50%, #22d3ee 70%, transparent 100%)",
                  boxShadow: "0 0 16px rgba(34,211,238,0.4)",
                }}
              />
            </motion.header>

            {/* Expanded Content */}
            <div className="relative z-10 flex-1 flex flex-col items-center px-8 pt-[72px] pb-32" style={{ justifyContent: 'flex-start' }}>
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                  className="text-center max-w-5xl w-full"
                >
                  {/* Badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.5, type: "spring", bounce: 0.4 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/15 border border-white/30 text-white text-sm mb-8"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Quantum Learning Journey
                  </motion.div>

                  {/* Hero Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="text-5xl font-bold mb-6 text-white"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    Welcome to Quantum
                  </motion.h2>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="text-lg text-white/80 mb-12 leading-relaxed max-w-2xl mx-auto"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    Your journey into quantum physics begins now. Choose a path below to start exploring the fundamental mysteries of the universe.
                  </motion.p>

                  {/* -- Core Topics Section (Top) ---------------------------- */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6, duration: 0.6 }}
                    className="w-full"
                  >
                    {/* Section Heading */}
                    <div className="text-center mb-10">
                      <h3
                        className="text-3xl font-bold text-white mb-3"
                        style={{ fontFamily: "var(--font-playfair)" }}
                      >
                        Core Topics
                      </h3>
                      <div className="w-20 h-1 bg-cyan-400 mx-auto rounded-full" style={{ boxShadow: "0 0 12px rgba(34,211,238,0.6)" }} />
                    </div>

                    {/* Topics Grid */}
                    <motion.div
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: { transition: { staggerChildren: 0.05 } },
                      }}
                    >
                      {coreTopics.map((topic) => (
                        <Link key={topic.slug} href={`/topics/${topic.slug}`} className="block">
                          <motion.div
                            layoutId={`topic-card-${topic.slug}`}
                            variants={overlayCardVariant}
                            whileHover={{
                              y: -5,
                              boxShadow: "0 0 25px rgba(34,211,238,0.2)",
                              borderColor: "rgba(34,211,238,0.5)",
                            }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer group text-left"
                          >
                            <h4
                              className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-200"
                              style={{ fontFamily: "var(--font-playfair)" }}
                            >
                              {topic.title}
                            </h4>
                            <p
                              className="text-slate-300 text-sm mb-4 leading-relaxed"
                              style={{ fontFamily: "var(--font-dm-sans)" }}
                            >
                              {topic.desc}
                            </p>
                            <div className="flex items-center gap-1 text-cyan-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              Learn More
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </motion.div>
                        </Link>
                      ))}
                    </motion.div>
                  </motion.div>

                  {/* -- AI Feature Cards (Bottom) ---------------------------- */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8, duration: 0.6 }}
                    className="mt-16"
                  >
                    <div className="text-center mb-8">
                      <h3
                        className="text-3xl font-bold text-white mb-3"
                        style={{ fontFamily: "var(--font-playfair)" }}
                      >
                        Powered by AI
                      </h3>
                      <div className="w-20 h-1 bg-purple-400 mx-auto rounded-full" style={{ boxShadow: "0 0 12px rgba(168,85,247,0.6)" }} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        {
                          icon: <Atom className="w-8 h-8" />,
                          title: "Interactive Simulations",
                          desc: "Visualize quantum phenomena in real-time",
                        },
                        {
                          icon: <Brain className="w-8 h-8" />,
                          title: "AI-Powered Tutoring",
                          desc: "Ask questions, get instant explanations",
                        },
                        {
                          icon: <Sparkles className="w-8 h-8" />,
                          title: "Progressive Learning",
                          desc: "From basics to advanced quantum mechanics",
                        },
                      ].map((feature, i) => (
                        <motion.div
                          key={feature.title}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 2 + i * 0.15, duration: 0.5 }}
                          className="p-6 rounded-2xl bg-black/15 border border-white/25 hover:bg-black/25 hover:border-white/40 transition-all group cursor-pointer"
                        >
                          <div className="text-white mb-4 group-hover:scale-110 transition-transform">
                            {feature.icon}
                          </div>
                          <h4
                            className="text-lg font-semibold mb-2 text-white"
                            style={{ fontFamily: "var(--font-playfair)" }}
                          >
                            {feature.title}
                          </h4>
                          <p
                            className="text-white/70 text-sm"
                            style={{ fontFamily: "var(--font-dm-sans)" }}
                          >
                            {feature.desc}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* CTA Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.4, duration: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      className="px-8 py-4 rounded-full bg-white text-purple-600 font-semibold shadow-lg hover:bg-white/90 transition-colors"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      Begin Your Journey
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setIsExpanded(false)}
                      className="px-8 py-4 rounded-full border-2 border-white/50 text-white font-semibold hover:bg-white/10 transition-all"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      Explore Topics First
                    </motion.button>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
