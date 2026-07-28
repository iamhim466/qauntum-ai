"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Sparkles, Send, FlaskConical, Brain, ArrowRight } from "lucide-react";

// ── Preview conversation data ─────────────────────────────────

const previewMessages = [
  {
    role: "user" as const,
    content: "How does quantum entanglement actually work?",
  },
  {
    role: "assistant" as const,
    content:
      "Great question! Let me think through this step by step.\n\nImagine two particles — say, photons — are created together in a special process. From that moment on, they share a single quantum state, even if you separate them by light-years.\n\nHere's the key insight: before measurement, neither particle has a definite state. They exist in a shared superposition. When you measure one and find it's \"spin-up,\" the other instantly becomes \"spin-down\" — no matter the distance.\n\nThis isn't because information travels between them. It's because they were never truly separate to begin with — they're two parts of one quantum system.",
  },
  {
    role: "user" as const,
    content: "Can we use that for communication?",
  },
  {
    role: "assistant" as const,
    content:
      "Not directly, unfortunately! While entanglement is real and instantaneous, you can't use it to send information faster than light.\n\nHere's why: when you measure your entangled particle, you get a random result. Your friend with the other particle also gets a random result. Only when you compare notes (through classical communication) do you see the correlations.\n\nHowever, entanglement is incredibly useful for:\n• Quantum key distribution (ultra-secure encryption)\n• Quantum teleportation (transferring quantum states)\n• Quantum computing (entangled qubits exponentially increase power)\n\nSo it's not a phone — it's something even more powerful.",
  },
];

// ── Component ──────────────────────────────────────────────────

export default function DeepSeekSection() {
  // Cursor tracking for glow effect
  const [isHovering, setIsHovering] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  return (
    <section className="relative py-16 px-6 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        {/* ── Section Header ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-8"
        >
          <span
            className="text-sm font-medium text-purple-400 tracking-wider uppercase mb-4 block"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Deep Reasoning AI
          </span>
          <h2
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Powered by{" "}
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              DeepSeek R1
            </span>
          </h2>
          <p
            className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            DeepSeek R1 is a state-of-the-art reasoning model that thinks
            step-by-step before answering — perfect for tackling the deepest
            questions in quantum physics.
          </p>
        </motion.div>

        {/* ── Two-Column Layout: Info + Chat Preview ──────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* ── Left: DeepSeek Explainer ─────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.7,
              delay: 0.1,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="space-y-4"
          >
            {/* What is DeepSeek */}
            <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(168,85,247,0.15)",
                    border: "1px solid rgba(168,85,247,0.3)",
                  }}
                >
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  What is DeepSeek R1?
                </h3>
              </div>
              <p
                className="text-gray-400 text-sm leading-relaxed"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                DeepSeek R1 is an advanced AI reasoning model that uses a{" "}
                <strong className="text-white/80">
                  chain-of-thought reasoning process
                </strong>{" "}
                — it thinks step-by-step before answering, making it
                exceptionally good at complex scientific questions.
              </p>
            </div>

            {/* Why it matters for quantum */}
            <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(34,211,238,0.15)",
                    border: "1px solid rgba(34,211,238,0.3)",
                  }}
                >
                  <FlaskConical className="w-5 h-5 text-cyan-400" />
                </div>
                <h3
                  className="text-lg font-bold"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  Why Deep Reasoning for Quantum?
                </h3>
              </div>
              <p
                className="text-gray-400 text-sm leading-relaxed"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Quantum physics requires careful, layered thinking. DeepSeek R1
                excels at breaking down concepts like entanglement,
                superposition, and wave functions into clear, step-by-step
                explanations — connecting abstract theory to real experiments
                with the depth a curious mind deserves.
              </p>
            </div>

            {/* Key capabilities */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Chain-of-Thought",
                  desc: "Step-by-step reasoning",
                  color: "#8b5cf6",
                },
                {
                  label: "32B Parameters",
                  desc: "Distilled from larger models",
                  color: "#06b6d4",
                },
                {
                  label: "Math & Science",
                  desc: "Strong STEM reasoning",
                  color: "#10b981",
                },
                {
                  label: "Open Weights",
                  desc: "Publicly available model",
                  color: "#f59e0b",
                },
              ].map((cap) => (
                <div
                  key={cap.label}
                  className="p-3 rounded-xl border border-white/8 bg-white/[0.02]"
                >
                  <div
                    className="text-xs font-bold mb-0.5"
                    style={{
                      color: cap.color,
                      fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    {cap.label}
                  </div>
                  <div
                    className="text-[11px] text-gray-500"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    {cap.desc}
                  </div>
                </div>
              ))}
            </div>

          </motion.div>

          {/* ── Right: Chat Preview Widget (visual only) ──────── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.7,
              delay: 0.2,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="relative"
          >
            {/* Cursor glow effect */}
            <motion.div
              className="pointer-events-none absolute -inset-1 rounded-3xl"
              animate={{ opacity: isHovering ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              style={{
                x: mouseX,
                y: mouseY,
                width: 200,
                height: 200,
                marginLeft: -100,
                marginTop: -100,
                background:
                  "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
              }}
            />

            <div
              className="relative rounded-3xl overflow-hidden flex flex-col cursor-default"
              style={{
                height: "440px",
                background: "rgba(8, 12, 20, 0.85)",
                border: "1px solid rgba(168, 85, 247, 0.15)",
                boxShadow:
                  "0 0 40px rgba(168, 85, 247, 0.06), 0 8px 60px rgba(0,0,0,0.5)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Chat Header */}
              <div
                className="flex items-center gap-2 px-4 py-3 border-b"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(34,211,238,0.25))",
                    border: "1px solid rgba(34,211,238,0.2)",
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <span
                  className="text-xs text-white/50 flex-1"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  DeepSeek R1 Quantum Tutor
                </span>
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px]"
                  style={{
                    background: "rgba(168,85,247,0.1)",
                    border: "1px solid rgba(168,85,247,0.2)",
                    fontFamily: "var(--font-dm-sans)",
                  }}
                >
                  <FlaskConical className="w-2.5 h-2.5 text-purple-400" />
                  <span className="text-purple-400">Reasoning</span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto py-4 px-4">
                {previewMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: 0.3 + i * 0.25,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className={`mb-4 flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0 mr-2 mt-1">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(34,211,238,0.25))",
                            border: "1px solid rgba(34,211,238,0.2)",
                          }}
                        >
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                        </div>
                      </div>
                    )}
                    <motion.div
                      whileHover={{
                        scale: 1.01,
                        boxShadow: "0 0 20px rgba(168,85,247,0.08)",
                      }}
                      transition={{ duration: 0.2 }}
                      className={`max-w-[85%] px-3 py-2.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-purple-500/15 border border-purple-500/25 text-white"
                          : "bg-white/4 border border-white/8 text-white/85"
                      }`}
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      {msg.content}
                    </motion.div>
                  </motion.div>
                ))}

                {/* Animated thinking indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.5, duration: 0.4 }}
                  className="flex items-center gap-2 text-white/30 text-xs py-2"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  <div className="flex gap-1">
                    <motion.span
                      className="w-1.5 h-1.5 bg-purple-400 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: 0,
                      }}
                    />
                    <motion.span
                      className="w-1.5 h-1.5 bg-purple-400 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: 0.15,
                      }}
                    />
                    <motion.span
                      className="w-1.5 h-1.5 bg-purple-400 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: 0.3,
                      }}
                    />
                  </div>
                  <span>Thinking...</span>
                </motion.div>
              </div>

              {/* Decorative Input Bar */}
              <div className="px-3 pb-3 pt-1">
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span
                    className="flex-1 text-white/20 text-xs"
                    style={{ fontFamily: "var(--font-dm-sans)" }}
                  >
                    Ask about quantum physics...
                  </span>
                  <Send className="w-3.5 h-3.5 text-white/15" />
                </div>
              </div>
            </div>

            {/* CTA centered below chat widget */}
            <div className="text-center mt-3">
              <a href="/chat">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-purple-500/30 text-purple-400 text-sm font-medium hover:bg-purple-500/10 transition-colors cursor-pointer"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Open Full Chat
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
