"use client";

import { motion } from "framer-motion";

interface TopicHeroProps {
  slug: string;
  icon: string;
  title: string;
  shortDesc: string;
  accentColor: string;
  colorRgb: string;
}

export default function TopicHero({
  slug,
  icon,
  title,
  shortDesc,
  accentColor,
  colorRgb,
}: TopicHeroProps) {
  return (
    <motion.div
      layoutId={`topic-card-${slug}`}
      className="mb-8 text-center"
    >
      <span className="text-8xl block mb-6">{icon}</span>
      <h2
        className="text-5xl md:text-6xl font-bold mb-4"
        style={{ fontFamily: "var(--font-playfair)", color: accentColor }}
      >
        {title}
      </h2>
      <p
        className="text-xl text-gray-400 max-w-2xl mx-auto"
        style={{ fontFamily: "var(--font-dm-sans)" }}
      >
        {shortDesc}
      </p>
    </motion.div>
  );
}
