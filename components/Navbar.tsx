"use client";

import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Chat", href: "/chat" },
  { label: "Main Topics", href: "/?open-topics=true" },
  { label: "About", href: "/about" },
];

interface NavbarProps {
  onMainTopics?: () => void;
}

export default function Navbar({ onMainTopics }: NavbarProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed top-0 left-0 right-0 z-50 px-6 transition-all duration-500"
      style={{ paddingTop: scrolled ? "12px" : "20px" }}
    >
      <div
        className="mx-auto max-w-6xl flex justify-between items-center rounded-xl transition-all duration-500 ease-in-out"
        style={{
          padding: scrolled ? "8px 20px" : "14px 28px",
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
            className="font-extrabold tracking-tight transition-all duration-500 ease-in-out"
            style={{
              fontSize: scrolled ? "16px" : "22px",
              fontFamily: "var(--font-playfair)",
              color: "white",
              textShadow: "0 0 16px rgba(34, 211, 238, 0.3)",
            }}
          >
            Quantum
          </span>
          <span
            className="whitespace-nowrap font-bold tracking-normal transition-all duration-500 ease-in-out ml-1.5"
            style={{
              fontSize: scrolled ? "14px" : "18px",
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
          {navLinks.map((link) => {
            if (link.label === "Main Topics") {
              if (isHome && onMainTopics) {
                return (
                  <button
                    key={link.label}
                    onClick={onMainTopics}
                    className="relative px-3 py-1.5 font-medium rounded-full transition-all duration-300 text-white/70 hover:text-white hover:bg-white/10"
                    style={{ fontSize: scrolled ? "12px" : "14px" }}
                  >
                    {link.label}
                  </button>
                );
              }
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="relative px-3 py-1.5 font-medium rounded-full transition-all duration-300 text-white/70 hover:text-white hover:bg-white/10"
                  style={{ fontSize: scrolled ? "12px" : "14px" }}
                >
                  {link.label}
                </Link>
              );
            }
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative px-3 py-1.5 font-medium rounded-full transition-all duration-300 ${
                  pathname === link.href
                    ? "text-white bg-white/10"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                style={{ fontSize: scrolled ? "12px" : "14px" }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Animated neon cyan glow bar underneath the pill */}
      <motion.div
        className="mx-auto max-w-6xl h-px mt-1 rounded-full overflow-hidden"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #22d3ee 30%, #67e8f9 50%, #22d3ee 70%, transparent 100%)",
          boxShadow: "0 0 16px rgba(34,211,238,0.4)",
        }}
      />
    </motion.header>
  );
}
