"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileText,
  Users,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Clock,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  updated: string;
  pdfUrl: string;
  categories: string[];
}

// ── Component ──────────────────────────────────────────────────────

export default function ArxivSearch() {
  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState<ArxivPaper[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  const handleSearch = useCallback(
    async (e?: React.FormEvent, overrideQuery?: string) => {
      if (e) e.preventDefault();
      const q = (overrideQuery ?? query).trim();
      if (!q || isLoading) return;

      setIsLoading(true);
      setError(null);
      setHasSearched(true);
      setCooldown(true);
      // Client-side cooldown: prevent spamming arXiv (3s)
      cooldownRef.current = setTimeout(() => setCooldown(false), 3000);

      try {
        const res = await fetch(
          `/api/arxiv?q=${encodeURIComponent(q)}&max=8`
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({
            error: `Search failed (${res.status})`,
          }));
          throw new Error(errData.error || `Search failed (${res.status})`);
        }
        const data = await res.json();
        setPapers(data.papers ?? []);
        setTotalResults(data.totalResults ?? 0);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        setPapers([]);
      } finally {
        setIsLoading(false);
      }
    },
    [query, isLoading]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr.slice(0, 10);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Search Header ─────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(16,185,129,0.2))",
              border: "1px solid rgba(6,182,212,0.25)",
            }}
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3
              className="text-sm font-semibold text-white"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              arXiv Papers
            </h3>
            <p
              className="text-[10px] text-white/30"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Search quantum physics research papers
            </p>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div
            className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Search className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search papers... (e.g. quantum error correction)"
              rows={1}
              className="flex-1 bg-transparent text-white text-xs placeholder-white/20 resize-none outline-none"
              style={{
                fontFamily: "var(--font-dm-sans)",
                maxHeight: "60px",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || isLoading || cooldown}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-[10px] font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: query.trim()
                ? "rgba(6,182,212,0.15)"
                : "rgba(255,255,255,0.03)",
              border: `1px solid ${query.trim() ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.06)"}`,
              color: query.trim() ? "#22d3ee" : "rgba(255,255,255,0.25)",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "Search"
            )}
          </button>
        </form>
      </div>

      {/* ── Results ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-3 rounded-xl text-xs"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {papers.map((paper) => (
            <motion.div
              key={paper.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mb-3"
            >
              <div
                className="rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* Paper Header */}
                <button
                  onClick={() => toggleExpand(paper.id)}
                  className="w-full text-left px-3.5 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-medium text-white/90 leading-snug mb-1"
                        style={{ fontFamily: "var(--font-dm-sans)" }}
                      >
                        {paper.title}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] text-white/30 flex items-center gap-1"
                          style={{ fontFamily: "var(--font-dm-sans)" }}
                        >
                          <Users className="w-2.5 h-2.5" />
                          {paper.authors.slice(0, 2).join(", ")}
                          {paper.authors.length > 2 ? " +more" : ""}
                        </span>
                        {paper.published && (
                          <span
                            className="text-[10px] text-white/20 flex items-center gap-1"
                            style={{ fontFamily: "var(--font-dm-sans)" }}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            {formatDate(paper.published)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-1">
                      {expandedId === paper.id ? (
                        <ChevronUp className="w-3.5 h-3.5 text-white/25" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-white/25" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedId === paper.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3.5 pb-3 space-y-2.5">
                        {/* Authors */}
                        <div>
                          <p
                            className="text-[10px] text-white/25 uppercase tracking-wider mb-1"
                            style={{ fontFamily: "var(--font-dm-sans)" }}
                          >
                            Authors
                          </p>
                          <p
                            className="text-[11px] text-white/50 leading-relaxed"
                            style={{ fontFamily: "var(--font-dm-sans)" }}
                          >
                            {paper.authors.join(", ")}
                          </p>
                        </div>

                        {/* Abstract */}
                        <div>
                          <p
                            className="text-[10px] text-white/25 uppercase tracking-wider mb-1"
                            style={{ fontFamily: "var(--font-dm-sans)" }}
                          >
                            Abstract
                          </p>
                          <p
                            className="text-[11px] text-white/45 leading-relaxed"
                            style={{ fontFamily: "var(--font-dm-sans)" }}
                          >
                            {paper.summary}
                          </p>
                        </div>

                        {/* Categories */}
                        {paper.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {paper.categories.slice(0, 4).map((cat) => (
                              <span
                                key={cat}
                                className="px-2 py-0.5 rounded-full text-[9px]"
                                style={{
                                  background: "rgba(6,182,212,0.08)",
                                  border: "1px solid rgba(6,182,212,0.15)",
                                  color: "#67e8f9",
                                  fontFamily: "var(--font-dm-sans)",
                                }}
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* PDF Link */}
                        <a
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:scale-105"
                          style={{
                            background: "rgba(6,182,212,0.1)",
                            border: "1px solid rgba(6,182,212,0.2)",
                            color: "#22d3ee",
                            fontFamily: "var(--font-dm-sans)",
                          }}
                        >
                          <ExternalLink className="w-3 h-3" />
                          View PDF
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {hasSearched && !isLoading && papers.length === 0 && !error && (
          <div className="text-center py-8">
            <Search className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p
              className="text-xs text-white/25"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              No papers found. Try a different query.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && !isLoading && (
          <div className="text-center py-8">
            <BookOpen className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p
              className="text-xs text-white/25 mb-1"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Search for quantum physics papers on arXiv
            </p>
            <p
              className="text-[10px] text-white/15"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Rate limited to 1 request per 3 seconds
            </p>
          </div>
        )}

        {/* Result count */}
        {totalResults > 0 && papers.length > 0 && (
          <p
            className="text-center text-[10px] text-white/15 mt-2"
            style={{ fontFamily: "var(--font-dm-sans)" }}
          >
            Showing {papers.length} of {totalResults.toLocaleString()} results
          </p>
        )}
      </div>
    </div>
  );
}
