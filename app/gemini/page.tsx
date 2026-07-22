"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  Send,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Atom,
  Brain,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";

// ── Types ──────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Sample prompts ─────────────────────────────────────────────

const samplePrompts = [
  { icon: <Atom className="w-5 h-5" />, text: "Explain quantum superposition" },
  { icon: <Brain className="w-5 h-5" />, text: "How does quantum entanglement work?" },
  { icon: <Lightbulb className="w-5 h-5" />, text: "What is wave-particle duality?" },
  { icon: <Sparkles className="w-5 h-5" />, text: "How do quantum computers work?" },
];

// ── Helper ─────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// ── Component ──────────────────────────────────────────────────

export default function GeminiPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  // ── Chat actions ──────────────────────────────────────────────

  function createNewChat() {
    setActiveChatId(null);
    setInput("");
  }

  function startChatWithMessage(message: string) {
    const newChat: Chat = {
      id: generateId(),
      title: message.slice(0, 40) + (message.length > 40 ? "..." : ""),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    sendMessage(newChat.id, message);
  }

  function sendMessage(chatId: string, content: string) {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatId) return chat;
        return {
          ...chat,
          messages: [...chat.messages, userMessage],
          updatedAt: new Date(),
        };
      })
    );

    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: getSimulatedResponse(content),
        timestamp: new Date(),
      };

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== chatId) return chat;
          return {
            ...chat,
            messages: [...chat.messages, aiMessage],
            updatedAt: new Date(),
          };
        })
      );
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  }

  function deleteChat(chatId: string) {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    if (activeChatId) {
      sendMessage(activeChatId, input);
    } else {
      startChatWithMessage(input);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }, [input]);

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* ── Floating Chat Container ──────────────────────────── */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-[80px] pb-6">
        <div
          className="w-full max-w-6xl h-[calc(100vh-120px)] flex rounded-3xl overflow-hidden"
          style={{
            background: "rgba(8, 12, 20, 0.85)",
            border: "1px solid rgba(34, 211, 238, 0.12)",
            boxShadow: "0 0 40px rgba(34, 211, 238, 0.06), 0 8px 60px rgba(0,0,0,0.5)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* ── Sidebar ──────────────────────────────────────────── */}
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 260, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex-shrink-0 overflow-hidden border-r border-white/8"
              >
                <div className="flex flex-col h-full w-[260px]">
                  {/* New Chat + Toggle */}
                  <div className="p-3 flex gap-2">
                    <button
                      onClick={createNewChat}
                      className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 hover:bg-white/5"
                      style={{
                        border: "1px solid rgba(34, 211, 238, 0.15)",
                        fontFamily: "var(--font-dm-sans)",
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-white/70">New Chat</span>
                    </button>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
                      title="Close sidebar"
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Chat History */}
                  <div className="flex-1 overflow-y-auto px-2 pb-3">
                    <div className="space-y-0.5">
                      {chats.map((chat) => (
                        <button
                          key={chat.id}
                          className={`w-full group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-200 ${
                            chat.id === activeChatId
                              ? "bg-white/8 text-white"
                              : "text-white/50 hover:bg-white/4 hover:text-white/70"
                          }`}
                          style={{ fontFamily: "var(--font-dm-sans)" }}
                          onClick={() => setActiveChatId(chat.id)}
                        >
                          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
                          <span className="truncate flex-1 text-left">{chat.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </button>
                      ))}
                    </div>

                    {chats.length === 0 && (
                      <div className="px-3 py-10 text-center">
                        <p className="text-white/25 text-[11px]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                          No conversations yet
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sidebar Footer */}
                  <div className="p-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-[10px] text-white/25" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      <Sparkles className="w-3 h-3 text-purple-400/60" />
                      Powered by Gemini AI
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Main Chat Area ───────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top bar with sidebar toggle */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
                  title="Open sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              )}
              <span className="text-xs text-white/30" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {activeChat ? activeChat.title : "New Conversation"}
              </span>
            </div>

            {/* Messages or Welcome */}
            <div className="flex-1 overflow-y-auto">
              {activeChat && activeChat.messages.length > 0 ? (
                /* ── Active Chat Messages ────────────────────────── */
                <div className="max-w-3xl mx-auto py-6 px-6">
                  <AnimatePresence>
                    {activeChat.messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`mb-6 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="flex-shrink-0 mr-3 mt-1">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center"
                              style={{
                                background: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(34,211,238,0.25))",
                                border: "1px solid rgba(34,211,238,0.2)",
                              }}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-purple-500/15 border border-purple-500/25 text-white"
                              : "bg-white/4 border border-white/8 text-white/85"
                          }`}
                          style={{ fontFamily: "var(--font-dm-sans)" }}
                        >
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-white/40 text-sm"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(34,211,238,0.25))", border: "1px solid rgba(34,211,238,0.2)" }}>
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              ) : (
                /* ── Welcome Screen ──────────────────────────────── */
                <div className="flex flex-col items-center justify-center h-full px-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center max-w-lg"
                  >
                    {/* Logo */}
                    <div
                      className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(34,211,238,0.15))",
                        border: "1px solid rgba(34,211,238,0.2)",
                        boxShadow: "0 0 25px rgba(34,211,238,0.1)",
                      }}
                    >
                      <Sparkles className="w-7 h-7 text-cyan-400" />
                    </div>

                    <h1
                      className="text-2xl font-bold mb-2"
                      style={{ fontFamily: "var(--font-playfair)" }}
                    >
                      Hi, I&apos;m <span className="text-purple-400">Gemini</span>
                    </h1>
                    <p
                      className="text-white/40 text-sm mb-8"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      Your AI-powered quantum physics tutor. Ask me anything.
                    </p>

                    {/* Sample Prompts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {samplePrompts.map((prompt, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + i * 0.08 }}
                          onClick={() => {
                            const newChat: Chat = {
                              id: generateId(),
                              title: prompt.text.slice(0, 40),
                              messages: [],
                              createdAt: new Date(),
                              updatedAt: new Date(),
                            };
                            setChats((prev) => [newChat, ...prev]);
                            setActiveChatId(newChat.id);
                            sendMessage(newChat.id, prompt.text);
                          }}
                          className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-200 hover:bg-white/4 group"
                          style={{
                            background: "rgba(255,255,255,0.015)",
                            border: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <div className="text-purple-400 group-hover:text-cyan-400 transition-colors">
                            {prompt.icon}
                          </div>
                          <span className="text-white/50 text-xs group-hover:text-white/70 transition-colors" style={{ fontFamily: "var(--font-dm-sans)" }}>
                            {prompt.text}
                          </span>
                          <ArrowRight className="w-3 h-3 text-white/15 group-hover:text-cyan-400 transition-all ml-auto" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}
            </div>

            {/* ── Input Area ───────────────────────────────────────── */}
            <div className="px-4 pb-4 pt-2">
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                <div
                  className="flex items-end gap-2 rounded-2xl px-4 py-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about quantum physics..."
                    rows={1}
                    className="flex-1 bg-transparent text-white text-sm placeholder-white/25 resize-none outline-none py-1"
                    style={{ fontFamily: "var(--font-dm-sans)", maxHeight: "200px" }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="flex-shrink-0 p-2 rounded-xl transition-all duration-200 disabled:opacity-15 disabled:cursor-not-allowed hover:bg-white/8"
                    style={{
                      color: input.trim() ? "#22d3ee" : "rgba(255,255,255,0.25)",
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p
                  className="text-center text-[10px] text-white/15 mt-2"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  Gemini can make mistakes. Verify important information.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Simulated AI Responses ─────────────────────────────────────

function getSimulatedResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes("superposition")) {
    return "Superposition is one of the most fascinating principles in quantum mechanics. It states that a quantum system can exist in multiple states simultaneously until it is measured.\n\nThink of it like a coin spinning in the air — it's neither heads nor tails until it lands. In the quantum world, particles like electrons can be in a superposition of spin-up and spin-down states at the same time.\n\nMathematically, we express this as |ψ⟩ = α|0⟩ + β|1⟩, where α and β are probability amplitudes. When we measure, the superposition \"collapses\" into one definite state.\n\nThis is the foundation of quantum computing — qubits leverage superposition to process multiple calculations simultaneously, giving quantum computers their exponential computational power for certain tasks.";
  }

  if (q.includes("entanglement")) {
    return "Quantum entanglement is what Einstein famously called \"spooky action at a distance.\" It occurs when two or more particles become linked in such a way that the quantum state of each particle cannot be described independently.\n\nWhen two particles are entangled, measuring one instantly determines the state of the other — regardless of the distance between them. They could be on opposite sides of the galaxy, and the correlation would still be instantaneous.\n\nThe most famous entangled state is the Bell state: |Φ⁺⟩ = (|00⟩ + |11⟩)/√2. Measuring the first particle as |0⟩ immediately tells you the second is also |0⟩.\n\nApplications include quantum teleportation, ultra-secure quantum key distribution, and quantum computing. In 2022, the Nobel Prize in Physics was awarded for experimental work proving entanglement is real.";
  }

  if (q.includes("wave-particle") || q.includes("duality")) {
    return "Wave-particle duality is the concept that every quantum entity exhibits both wave and particle properties. It's one of the most mind-bending ideas in physics.\n\nThe double-slit experiment perfectly demonstrates this: when electrons pass through two slits, they create an interference pattern like waves. But when you observe which slit they go through, they behave like particles, hitting the screen in discrete spots.\n\nLight was the first to show this duality — Einstein showed that light (thought to be purely a wave) also behaves as discrete packets called photons. De Broglie then proposed that all matter has wave-like properties, confirmed when electrons produced diffraction patterns.\n\nThe wavelength of any particle is inversely proportional to its momentum: λ = h/p. This is why we don't notice wave behavior in everyday objects — their wavelengths are immeasurably small.";
  }

  if (q.includes("quantum computing") || q.includes("qubit")) {
    return "Quantum computing harnesses quantum-mechanical phenomena like superposition and entanglement to perform computations. It's fundamentally different from classical computing.\n\nClassical bits are either 0 or 1. Qubits, however, can exist in superpositions of both states simultaneously. When you have n qubits, you can represent 2^n states at once — exponential growth.\n\nKey concepts:\n• Quantum gates (H, X, Z, CNOT) manipulate qubits\n• Quantum circuits combine gates to perform algorithms\n• Shor's algorithm can factor large numbers exponentially faster than classical computers\n• Grover's algorithm speeds up database searches quadratically\n\nCompanies like IBM, Google, and others are building quantum processors. We're in the NISQ (Noisy Intermediate-Scale Quantum) era, working toward fault-tolerant quantum computing with error correction.";
  }

  if (q.includes("tunneling")) {
    return "Quantum tunneling is a phenomenon where a particle passes through a potential energy barrier that it classically could not surmount. It's one of the most counterintuitive quantum effects.\n\nIn classical physics, if you throw a ball at a wall, it bounces back. But in quantum mechanics, a particle's wave function extends beyond the barrier, giving it a non-zero probability of appearing on the other side.\n\nThe tunneling probability decays exponentially with barrier width: T ∝ e^(-2κL). This means thinner barriers are more transparent to quantum particles.\n\nNatural applications:\n• Nuclear fusion in stars (protons tunnel through electrostatic repulsion)\n• Radioactive alpha decay\n• Scanning tunneling microscopes (can image individual atoms)\n• Flash memory and tunnel diodes in electronics";
  }

  if (q.includes("observer") || q.includes("measurement")) {
    return "The observer effect in quantum mechanics refers to the phenomenon where measuring or observing a quantum system fundamentally changes its state. Before measurement, a system exists in superposition; measurement causes it to collapse into a definite state.\n\nThis is at the heart of the measurement problem — one of the deepest puzzles in physics. Different interpretations offer different explanations:\n\n• Copenhagen interpretation: The wave function represents our knowledge, and measurement updates it\n• Many-Worlds: No collapse occurs — the universe branches into parallel realities\n• Pilot wave theory: Hidden variables guide particles along definite paths\n\nSchrödinger's cat illustrates this: a cat in a sealed box with a quantum trigger exists in superposition of alive AND dead until observed.\n\nPractically, the observer effect matters in quantum computing (decoherence), quantum cryptography (eavesdropping detection), and building reliable quantum technologies.";
  }

  if (q.includes("wave function") || q.includes("schrodinger")) {
    return "The wave function (ψ) is a mathematical function that describes the quantum state of a system. It contains all information that can be known about a quantum system.\n\nThe time-dependent Schrödinger equation governs how wave functions evolve:\niℏ ∂ψ/∂t = Ĥψ\n\nThis is the quantum equivalent of Newton's second law — given a wave function at one time, it predicts the wave function at any future time.\n\nKey points:\n• |ψ|² gives the probability density of finding a particle at a given location (Born rule)\n• The wave function must be normalized (total probability = 1)\n• Different interpretations give different physical meanings to ψ\n• In Copenhagen, it represents knowledge; in Many-Worlds, it's fundamental reality\n\nThe Schrödinger equation is to quantum mechanics what F=ma is to classical mechanics — the fundamental equation of motion.";
  }

  if (q.includes("schrodinger") && q.includes("cat")) {
    return "Schrödinger's cat is a famous thought experiment proposed by Erwin Schrödinger in 1935 to illustrate the measurement problem in quantum mechanics.\n\nThe setup: A cat is placed in a sealed box with a radioactive atom, a Geiger counter, and a vial of poison. If the atom decays (a quantum event with 50% probability in one hour), the Geiger counter triggers, breaking the vial and killing the cat.\n\nAccording to quantum mechanics, until the box is opened, the atom is in superposition of decayed and not decayed. This means the cat is simultaneously alive AND dead — a superposition that persists until measurement.\n\nSchrödinger designed this to highlight what he saw as the absurdity of applying quantum superposition to everyday objects. How can a cat be both alive and dead?\n\nToday, physicists understand that quantum superposition is fragile and collapses quickly for large objects due to decoherence. The thought experiment remains a powerful illustration of quantum measurement and the boundary between quantum and classical worlds.";
  }

  return `That's a great question about quantum physics! Let me share what I know.\n\nQuantum mechanics is the branch of physics that deals with the behavior of matter and energy at the smallest scales — atoms, electrons, photons, and other subatomic particles. At these scales, the rules of classical physics break down, and strange quantum effects take over.\n\nKey principles include:\n• Superposition — particles exist in multiple states simultaneously\n• Entanglement — particles can be instantaneously correlated\n• Wave-particle duality — matter exhibits both wave and particle properties\n• The uncertainty principle — certain pairs of properties cannot be precisely known simultaneously\n• Quantum tunneling — particles can pass through barriers\n\nThese principles aren't just theoretical curiosities — they're the foundation of technologies like semiconductors, lasers, MRI machines, and quantum computers.\n\nWould you like me to explain any of these concepts in more detail?`;
}
