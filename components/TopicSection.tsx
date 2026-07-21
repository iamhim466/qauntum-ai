"use client";

import { motion } from "framer-motion";

interface TopicSectionProps {
  index: number;
  heading: string;
  content: string;
  icon?: React.ReactNode;
  accentColor: string;
  colorRgb: string;
  interactive: React.ReactNode;
  reversed?: boolean;
}

export default function TopicSection({
  index,
  heading,
  content,
  icon,
  accentColor,
  colorRgb,
  interactive,
  reversed = false,
}: TopicSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.7,
        delay: 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={`flex flex-col ${reversed ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8 lg:gap-12 items-center mb-20`}
    >
      {/* Interactive Side */}
      <motion.div
        initial={{ opacity: 0, x: reversed ? 40 : -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{
          duration: 0.6,
          delay: 0.2,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="w-full lg:w-1/2"
      >
        {interactive}
      </motion.div>

      {/* Text Card Side */}
      <motion.div
        initial={{ opacity: 0, x: reversed ? -40 : 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{
          duration: 0.6,
          delay: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="w-full lg:w-1/2"
      >
        <div
          className="relative p-8 rounded-2xl border backdrop-blur-sm"
          style={{
            backgroundColor: `rgba(${colorRgb},0.06)`,
            borderColor: `rgba(${colorRgb},0.2)`,
          }}
        >
          {/* Section Number Badge */}
          <div
            className="absolute -top-4 left-8 px-4 py-1 rounded-full text-xs font-bold tracking-wider"
            style={{
              backgroundColor: `rgba(${colorRgb},0.3)`,
              color: "white",
              fontFamily: "var(--font-dm-sans)",
              border: `1px solid rgba(${colorRgb},0.4)`,
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </div>

          {/* Icon + Heading */}
          <div className="flex items-center gap-3 mb-4 mt-2">
            {icon && (
              <div
                className="p-2 rounded-xl"
                style={{
                  backgroundColor: `rgba(${colorRgb},0.15)`,
                }}
              >
                {icon}
              </div>
            )}
            <h3
              className="text-2xl font-bold"
              style={{
                fontFamily: "var(--font-playfair)",
                color: accentColor,
              }}
            >
              {heading}
            </h3>
          </div>

          {/* Content */}
          <p
            className="text-gray-300 leading-relaxed text-lg"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            {content}
          </p>

          {/* Decorative accent line */}
          <div
            className="absolute bottom-0 left-8 right-8 h-px"
            style={{
              background: `linear-gradient(90deg, transparent 0%, rgba(${colorRgb},0.3) 50%, transparent 100%)`,
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
