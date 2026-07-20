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
