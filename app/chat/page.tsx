"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  Zap,
  FlaskConical,
  BookOpen,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ArxivSearch from "@/components/ArxivSearch";

// ── Types ──────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface StoredChat {
  id: string;
  title: string;
  messages: Message[];
  modelType: ModelType;
}

type ModelType = "fast" | "reasoning";
type LevelType = "beginner" | "intermediate" | "advanced";

// ── Sample prompts ─────────────────────────────────────────────

const samplePrompts = [
  { icon: <Atom className="w-5 h-5" />, text: "Explain quantum superposition" },
  { icon: <Brain className="w-5 h-5" />, text: "How does quantum entanglement work?" },
  { icon: <Lightbulb className="w-5 h-5" />, text: "What is wave-particle duality?" },
  { icon: <Sparkles className="w-5 h-5" />, text: "How do quantum computers work?" },
];

// ── Helpers ────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// ── Component ──────────────────────────────────────────────────

export default function ChatPage() {
  const [chats, setChats] = useState<StoredChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [modelType, setModelType] = useState<ModelType>("fast");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArxiv, setShowArxiv] = useState(false);
  const [awaitingLevel, setAwaitingLevel] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [pendingModelType, setPendingModelType] = useState<ModelType>("fast");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const chatsRef = useRef(chats);
  chatsRef.current = chats;

  const activeChat = chats.find((c) => c.id === activeChatId);
  const currentMessages = activeChat?.messages ?? [];

  // ── Auto-scroll ─────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  // ── Auto-resize textarea ────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }, [inputValue]);

  // ── Core send (calls the API with level) ──────────────────────
  const sendToApi = useCallback(
    async (chatId: string, textToSend: string, effectiveModelType: ModelType, level: LevelType) => {
      const userMsg: Message = { id: generateId(), role: "user", content: textToSend };
      const assistantMsg: Message = { id: generateId(), role: "assistant", content: "" };

      // Add user message and empty assistant message
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? { ...chat, messages: [...chat.messages, userMsg, assistantMsg] }
            : chat
        )
      );

      setIsLoading(true);

      // Build message history for API (use ref to get latest chats)
      const targetChat = chatsRef.current.find((c) => c.id === chatId) ?? { messages: [] };
      const apiMessages = [...targetChat.messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        abortRef.current = new AbortController();
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, modelType: effectiveModelType, level }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errData.error || `API error (${res.status})`);
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          // Parse SSE stream (Groq uses OpenAI-compatible format)
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  accumulated += delta;
                  // Update the assistant message in real-time
                  setChats((prev) =>
                    prev.map((chat) =>
                      chat.id === chatId
                        ? {
                            ...chat,
                            messages: chat.messages.map((m) =>
                              m.id === assistantMsg.id
                                ? { ...m, content: accumulated }
                                : m
                            ),
                          }
                        : chat
                    )
                  );
                }
              } catch {
                // Cloudflare or non-JSON lines — accumulate raw text
                accumulated += data;
                setChats((prev) =>
                  prev.map((chat) =>
                    chat.id === chatId
                      ? {
                          ...chat,
                          messages: chat.messages.map((m) =>
                            m.id === assistantMsg.id
                              ? { ...m, content: accumulated }
                              : m
                          ),
                        }
                      : chat
                  )
                );
              }
            } else if (line.trim() && !line.startsWith(":")) {
              // Cloudflare streaming (non-SSE format)
              accumulated += line;
              setChats((prev) =>
                prev.map((chat) =>
                  chat.id === chatId
                    ? {
                        ...chat,
                        messages: chat.messages.map((m) =>
                          m.id === assistantMsg.id
                            ? { ...m, content: accumulated }
                            : m
                        ),
                      }
                    : chat
                )
              );
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User cancelled — leave accumulated text as-is
        } else {
          const msg = err instanceof Error ? err.message : "Something went wrong";
          setError(msg);
          // Remove empty assistant message on error
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === chatId
                ? {
                    ...chat,
                    messages: chat.messages.filter((m) => m.id !== assistantMsg.id),
                  }
                : chat
            )
          );
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [chats]
  );

  // ── Streaming send ──────────────────────────────────────────
  const handleSend = useCallback(
    async (text?: string, overrideModelType?: ModelType) => {
      const textToSend = (text ?? inputValue).trim();
      if (!textToSend || isLoading) return;

      setError(null);
      setInputValue("");

      let chatId = activeChatId;

      // Create new chat if none active
      if (!chatId) {
        const newChat: StoredChat = {
          id: generateId(),
          title: textToSend.slice(0, 40) + (textToSend.length > 40 ? "..." : ""),
          messages: [],
          modelType,
        };
        setChats((prev) => [newChat, ...prev]);
        chatId = newChat.id;
        setActiveChatId(chatId);
      }

      const effectiveModelType = overrideModelType ?? modelType;

      // Show level picker first, then send after level is chosen
      setPendingMessage(textToSend);
      setPendingModelType(effectiveModelType);
      setAwaitingLevel(true);
    },
    [inputValue, isLoading, activeChatId, modelType]
  );

  // ── Level selected → now actually send ──────────────────────
  function handleLevelSelect(level: LevelType) {
    if (!pendingMessage || !activeChatId) return;
    const msg = pendingMessage;
    const model = pendingModelType;
    setAwaitingLevel(false);
    setPendingMessage(null);
    sendToApi(activeChatId, msg, model, level);
  }

  // ── Chat actions ──────────────────────────────────────────

  function createNewChat() {
    setActiveChatId(null);
    setError(null);
    setAwaitingLevel(false);
    setPendingMessage(null);
  }

  function switchChat(chatId: string) {
    setActiveChatId(chatId);
    setError(null);
    setAwaitingLevel(false);
    setPendingMessage(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function startChatWithSample(sampleText: string) {
    handleSend(sampleText, "fast");
  }

  function deleteChat(chatId: string) {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setError(null);
    }
  }

  // ── Render ──────────────────────────────────────────────────

  const hasMessages = activeChatId !== null && currentMessages.length > 0;
  const showMessageArea = hasMessages || awaitingLevel;

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

                  {/* Chat History or arXiv Panel (mutually exclusive) */}
                  {showArxiv ? (
                    <div className="flex-1 overflow-hidden border-t border-white/5">
                      <ArxivSearch />
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto px-2 pb-3">
                      <div className="space-y-0.5">
                        {chats.map((chat) => (
                          <div
                            key={chat.id}
                            role="button"
                            tabIndex={0}
                            className={`w-full group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                              chat.id === activeChatId
                                ? "bg-white/8 text-white"
                                : "text-white/50 hover:bg-white/4 hover:text-white/70"
                            }`}
                            style={{ fontFamily: "var(--font-dm-sans)" }}
                            onClick={() => switchChat(chat.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                switchChat(chat.id);
                              }
                            }}
                          >
                            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
                            <span className="truncate flex-1 text-left">{chat.title}</span>
                            <span className="text-[9px] opacity-30 flex-shrink-0">
                              {chat.modelType === "reasoning" ? "🧠" : "⚡"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChat(chat.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {chats.length === 0 && (
                        <div className="px-3 py-10 text-center">
                          <p
                            className="text-white/25 text-[11px]"
                            style={{ fontFamily: "var(--font-dm-sans)" }}
                          >
                            No conversations yet
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* arXiv Search Toggle */}
                  <div className="px-3 pb-2">
                    <button
                      onClick={() => setShowArxiv((v) => !v)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium transition-all duration-200 hover:bg-white/5"
                      style={{
                        border: showArxiv
                          ? "1px solid rgba(6,182,212,0.25)"
                          : "1px solid rgba(255,255,255,0.06)",
                        background: showArxiv ? "rgba(6,182,212,0.06)" : "transparent",
                        fontFamily: "var(--font-dm-sans)",
                      }}
                    >
                      <BookOpen className="w-3.5 h-3.5" style={{ color: showArxiv ? "#22d3ee" : "rgba(255,255,255,0.3)" }} />
                      <span style={{ color: showArxiv ? "#67e8f9" : "rgba(255,255,255,0.45)" }}>
                        arXiv Papers
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Main Chat Area ───────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top bar with sidebar toggle + model selector */}
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
              <span
                className="text-xs text-white/30 flex-1"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                {activeChat ? activeChat.title : "New Conversation"}
              </span>

              {/* Model Type Toggle */}
              <div
                className="flex items-center gap-1 p-0.5 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <button
                  onClick={() => setModelType("fast")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                    modelType === "fast"
                      ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25"
                      : "text-white/40 hover:text-white/60 border border-transparent"
                  }`}
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  <Zap className="w-3 h-3" />
                  Fast
                </button>
                <button
                  onClick={() => setModelType("reasoning")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                    modelType === "reasoning"
                      ? "bg-purple-500/15 text-purple-400 border border-purple-500/25"
                      : "text-white/40 hover:text-white/60 border border-transparent"
                  }`}
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  <FlaskConical className="w-3 h-3" />
                  Reasoning
                </button>
              </div>
            </div>

            {/* Messages or Welcome */}
            <div className="flex-1 overflow-y-auto">
              {showMessageArea ? (
                /* ── Active Chat Messages ────────────────────────── */
                <div className="max-w-3xl mx-auto py-6 px-6">
                  <AnimatePresence>
                    {currentMessages.map((msg) => (
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
                          className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
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

                  {/* Error banner */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 mx-auto max-w-2xl"
                    >
                      <div
                        className="flex items-start gap-3 p-4 rounded-xl border"
                        style={{
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.25)",
                        }}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-red-300 font-medium mb-1" style={{ fontFamily: "var(--font-dm-sans)" }}>
                            Something went wrong
                          </p>
                          <p className="text-xs text-red-300/70 leading-relaxed" style={{ fontFamily: "var(--font-dm-sans)" }}>
                            {error}
                          </p>
                        </div>
                        <button
                          onClick={() => setError(null)}
                          className="flex-shrink-0 p-1 rounded hover:bg-white/10 text-red-400/60 hover:text-red-300 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Level picker or Typing indicator */}
                  {awaitingLevel ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 max-w-md mx-auto"
                    >
                      <div
                        className="rounded-2xl p-5 border backdrop-blur-sm"
                        style={{
                          background: "rgba(168,85,247,0.06)",
                          border: "1px solid rgba(168,85,247,0.2)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <p
                            className="text-sm text-white/70"
                            style={{ fontFamily: "var(--font-dm-sans)" }}
                          >
                            What&apos;s your experience level?
                          </p>
                          <button
                            onClick={() => {
                              setAwaitingLevel(false);
                              setPendingMessage(null);
                            }}
                            className="text-white/25 hover:text-white/50 transition-colors p-1 rounded"
                            title="Cancel"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex gap-2">
                          {([
                            { level: "beginner" as LevelType, label: "Beginner", desc: "Simple analogies", color: "#10b981", emoji: "🌱" },
                            { level: "intermediate" as LevelType, label: "Intermediate", desc: "Balanced depth", color: "#f59e0b", emoji: "📚" },
                            { level: "advanced" as LevelType, label: "Advanced", desc: "Rigorous detail", color: "#ef4444", emoji: "🔬" },
                          ]).map((opt) => (
                            <motion.button
                              key={opt.level}
                              whileHover={{ scale: 1.04, y: -2 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleLevelSelect(opt.level)}
                              className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all cursor-pointer"
                              style={{
                                background: `${opt.color}10`,
                                border: `1px solid ${opt.color}30`,
                              }}
                            >
                              <span className="text-lg">{opt.emoji}</span>
                              <span
                                className="text-xs font-semibold"
                                style={{ color: opt.color, fontFamily: "var(--font-dm-sans)" }}
                              >
                                {opt.label}
                              </span>
                              <span
                                className="text-[9px] text-white/30"
                                style={{ fontFamily: "var(--font-dm-sans)" }}
                              >
                                {opt.desc}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : isLoading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-white/40 text-sm"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{
                          background: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(34,211,238,0.25))",
                          border: "1px solid rgba(34,211,238,0.2)",
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </motion.div>
                  ) : null}

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
                      Quantum <span className="text-purple-400">AI Tutor</span>
                    </h1>
                    <p
                      className="text-white/40 text-sm mb-4"
                      style={{ fontFamily: "var(--font-dm-sans)" }}
                    >
                      Your AI-powered quantum physics tutor. Ask me anything.
                    </p>

                    {/* Model badge */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                      <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px]"
                        style={{
                          background: "rgba(34,211,238,0.08)",
                          border: "1px solid rgba(34,211,238,0.15)",
                          fontFamily: "var(--font-dm-sans)",
                        }}
                      >
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span className="text-cyan-400">Groq Llama 3.3</span>
                        <span className="text-white/30">•</span>
                        <FlaskConical className="w-3 h-3 text-purple-400" />
                        <span className="text-purple-400">Deepseek R1</span>
                      </div>
                    </div>

                    {/* Sample Prompts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {samplePrompts.map((prompt, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + i * 0.08 }}
                          onClick={() => startChatWithSample(prompt.text)}
                          className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-200 hover:bg-white/4 group"
                          style={{
                            background: "rgba(255,255,255,0.015)",
                            border: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <div className="text-purple-400 group-hover:text-cyan-400 transition-colors">
                            {prompt.icon}
                          </div>
                          <span
                            className="text-white/50 text-xs group-hover:text-white/70 transition-colors"
                            style={{ fontFamily: "var(--font-dm-sans)" }}
                          >
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="max-w-3xl mx-auto"
              >
                <div
                  className="flex items-end gap-2 rounded-2xl px-4 py-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about quantum physics..."
                    rows={1}
                    className="flex-1 bg-transparent text-white text-sm placeholder-white/25 resize-none outline-none py-1"
                    style={{ fontFamily: "var(--font-dm-sans)", maxHeight: "200px" }}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="flex-shrink-0 p-2 rounded-xl transition-all duration-200 disabled:opacity-15 disabled:cursor-not-allowed hover:bg-white/8"
                    style={{
                      color: inputValue.trim() ? "#22d3ee" : "rgba(255,255,255,0.25)",
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p
                  className="text-center text-[10px] text-white/15 mt-2"
                  style={{ fontFamily: "var(--font-dm-sans)" }}
                >
                  AI can make mistakes. Verify important information.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
