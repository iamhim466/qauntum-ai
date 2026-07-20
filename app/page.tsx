"use client";

import { useState, useRef } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import QuantumBackground from "@/components/QuantumBackground";

const navLinks = ["Home", "Gemini", "Main Topics", "About"];

export default function Home() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastScrollY = useRef(0);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const direction = latest > lastScrollY.current;
    const delta = Math.abs(latest - lastScrollY.current);

    // Only toggle after scrolling 10px to avoid jitter
    if (delta > 10) {
      setHidden(direction);
      lastScrollY.current = latest;
    }

    // Show backdrop blur after scrolling past the top
    setScrolled(latest > 50);
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Navigation Bar ─────────────────────────────── */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          scrolled ? "bg-black/70 backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <div className="w-full px-12 pt-8 pb-4 flex justify-between items-baseline">
          {/* Logo Group - Left */}
          <div className="flex items-baseline">
            <span
              className="text-4xl font-extrabold tracking-tight"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Quantum
            </span>
            <span
              className="whitespace-nowrap text-3xl font-bold tracking-normal text-purple-500 ml-3 bottom-0"
              style={{ fontFamily: "var(--font-great-vibes)" }}
            >
              The Easy Way
            </span>
          </div>

          {/* Navigation - Right */}
          <nav
            className="flex gap-6 text-lg items-center whitespace-nowrap mr-10"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="relative group transition-colors hover:text-purple-400"
              >
                {link}
                <span className="absolute bottom-[-3px] left-[-6px] right-[-6px] h-[1px] bg-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </a>
            ))}
          </nav>
        </div>

        {/* Neon cyan divider with animated pulsing glow */}
        <motion.div
          className="h-[1px] bg-cyan-400 w-full mt-4"
          style={{
            boxShadow:
              "0 0 40px rgba(34,211,238,0.7), 0 0 20px rgba(34,211,238,0.4), 0 0 8px rgba(34,211,238,0.3)",
          }}
          animate={{
            opacity: [0.7, 1, 0.7],
            boxShadow: [
              "0 0 40px rgba(34,211,238,0.7), 0 0 20px rgba(34,211,238,0.4), 0 0 8px rgba(34,211,238,0.3)",
              "0 0 60px rgba(34,211,238,0.9), 0 0 30px rgba(34,211,238,0.6), 0 0 12px rgba(34,211,238,0.4)",
              "0 0 40px rgba(34,211,238,0.7), 0 0 20px rgba(34,211,238,0.4), 0 0 8px rgba(34,211,238,0.3)",
            ],
          }}
          transition={{
            duration: 2.5,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      </motion.header>

      {/* ── Hero Section with Quantum Background ──────── */}
      <section className="relative h-screen overflow-hidden">
        <QuantumBackground />

        {/* Hero content — sits above the canvas */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
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

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="mt-8 px-8 py-3 rounded-full border border-purple-500 text-purple-400 font-medium hover:bg-purple-500/10 transition-colors"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Start Learning
          </motion.button>
        </div>
      </section>
    </div>
  );
}
