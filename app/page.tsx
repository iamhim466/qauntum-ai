"use client";

import { motion } from "framer-motion";

const navLinks = ["Home", "Gemini", "Main Topics", "About"];

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Navigation Bar ─────────────────────────────── */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="w-full px-24 pt-16 pb-8 flex justify-between items-baseline">
          {/* Logo Group - Left */}
          <div className="flex items-baseline">
            <span
              className="text-7xl font-extrabold tracking-tight"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Quantum
            </span>
            <span
              className="whitespace-nowrap text-6xl font-bold tracking-normal text-purple-500 ml-6 bottom-0"
              style={{ fontFamily: "var(--font-great-vibes)" }}
            >
              The Easy Way
            </span>
          </div>

          {/* Navigation - Right */}
          <nav
            className="flex gap-20 text-3xl font-semibold items-center whitespace-nowrap mr-20"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="relative transition-opacity hover:opacity-70"
              >
                {link}
                <span className="absolute bottom-[-6px] left-[-12px] right-[-12px] h-[2px] bg-purple-500" />
              </a>
            ))}
          </nav>
        </div>

        {/* Neon cyan divider with animated pulsing glow */}
        <motion.div
          className="h-[2px] bg-cyan-400 w-full mt-8"
          style={{ boxShadow: '0 0 40px rgba(34,211,238,0.7), 0 0 20px rgba(34,211,238,0.4), 0 0 8px rgba(34,211,238,0.3)' }}
          animate={{
            opacity: [0.7, 1, 0.7],
            boxShadow: [
              '0 0 40px rgba(34,211,238,0.7), 0 0 20px rgba(34,211,238,0.4), 0 0 8px rgba(34,211,238,0.3)',
              '0 0 60px rgba(34,211,238,0.9), 0 0 30px rgba(34,211,238,0.6), 0 0 12px rgba(34,211,238,0.4)',
              '0 0 40px rgba(34,211,238,0.7), 0 0 20px rgba(34,211,238,0.4), 0 0 8px rgba(34,211,238,0.3)',
            ],
          }}
          transition={{
            duration: 2.5,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      </motion.header>
    </div>
  );
}
