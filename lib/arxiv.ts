// ── arXiv API Utilities ─────────────────────────────────────────────
// Parses Atom XML responses from http://export.arxiv.org/api/query
// Enforces rate limit: max 1 request every 3 seconds

export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  updated: string;
  pdfUrl: string;
  categories: string[];
}

interface ArxivSearchResponse {
  papers: ArxivPaper[];
  totalResults: number;
}

// ── Rate Limiter ───────────────────────────────────────────────────

let lastRequestTime = 0;
const MIN_INTERVAL_MS = 3000; // 3 seconds between requests

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    const waitMs = MIN_INTERVAL_MS - elapsed;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastRequestTime = Date.now();
}

// ── XML Parser (browser-safe, no external deps) ────────────────────

function stripCdata(str: string): string {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function parseArxivXml(xmlText: string): ArxivSearchResponse {
  // Use a minimal regex-based parser for Atom XML
  // arXiv returns well-structured Atom feeds — safe to parse with regex
  const xml = stripCdata(xmlText);

  // Extract total results
  const totalMatch = xmlText.match(
    /<opensearch:totalResults[^>]*>(\d+)<\/opensearch:totalResults>/
  );
  const totalResults = totalMatch ? parseInt(totalMatch[1], 10) : 0;

  // Split by <entry> tags to get individual papers
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  const entries: string[] = [];
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    entries.push(match[1]);
  }

  const papers: ArxivPaper[] = entries.map((entry) => {
    // Extract ID (arxiv URL)
    const idMatch = entry.match(/<id>([^<]+)<\/id>/);
    const rawId = idMatch ? idMatch[1] : "";
    // Normalize ID: extract just the arXiv ID (e.g., 2301.12345v1)
    const idParts = rawId.split("/abs/");
    const id = idParts.length > 1 ? idParts[1] : rawId;

    // Extract title (may span multiple lines)
    const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const title = titleMatch
      ? titleMatch[1].replace(/\s+/g, " ").trim()
      : "Untitled";

    // Extract authors
    const authorRegex = /<name>([^<]+)<\/name>/g;
    const authors: string[] = [];
    let authorMatch;
    while ((authorMatch = authorRegex.exec(entry)) !== null) {
      authors.push(authorMatch[1].trim());
    }

    // Extract summary/abstract
    const summaryMatch = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
    const summary = summaryMatch
      ? summaryMatch[1].replace(/\s+/g, " ").trim()
      : "";

    // Extract dates
    const publishedMatch = entry.match(
      /<published>([^<]+)<\/published>/
    );
    const published = publishedMatch ? publishedMatch[1] : "";

    const updatedMatch = entry.match(/<updated>([^<]+)<\/updated>/);
    const updated = updatedMatch ? updatedMatch[1] : "";

    // Extract PDF link
    const linkRegex = /<link[^>]*title="pdf"[^>]*href="([^"]+)"/;
    const pdfMatch = entry.match(linkRegex);
    // Fallback: construct PDF URL from ID
    const pdfUrl = pdfMatch
      ? pdfMatch[1]
      : `https://arxiv.org/pdf/${id}`;

    // Extract categories
    const categoryRegex = /term="([^"]+)"/g;
    const categories: string[] = [];
    let catMatch;
    while ((catMatch = categoryRegex.exec(entry)) !== null) {
      if (!categories.includes(catMatch[1])) {
        categories.push(catMatch[1]);
      }
    }

    return {
      id,
      title,
      authors,
      summary,
      published,
      updated,
      pdfUrl,
      categories,
    };
  });

  return { papers, totalResults };
}

// ── Search Cache (avoid duplicate requests within 60s) ─────────────
const searchCache = new Map<string, { data: ArxivSearchResponse; timestamp: number }>();
const CACHE_TTL_MS = 60_000;

function getCachedSearch(key: string): ArxivSearchResponse | null {
  const entry = searchCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  searchCache.delete(key);
  return null;
}

function setCachedSearch(key: string, data: ArxivSearchResponse): void {
  searchCache.set(key, { data, timestamp: Date.now() });
  // Evict oldest entries if cache grows too large
  if (searchCache.size > 50) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey !== undefined) searchCache.delete(oldestKey);
  }
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Search arXiv for papers matching a query.
 * Enforces rate limit (max 1 request every 3 seconds) and caches results for 60s.
 */
export async function searchArxiv(
  query: string,
  maxResults: number = 5,
  start: number = 0
): Promise<ArxivSearchResponse> {
  const cacheKey = `${query}:${maxResults}:${start}`;
  const cached = getCachedSearch(cacheKey);
  if (cached) return cached;

  await waitForRateLimit();

  const encodedQuery = encodeURIComponent(query);
  const url = `http://export.arxiv.org/api/query?search_query=all:${encodedQuery}&start=${start}&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "QuantumEasyWay/1.0 (https://github.com/iamhim466/qauntum-ai)",
    },
  });

  if (!res.ok) {
    throw new Error(`arXiv API error (${res.status}): ${await res.text()}`);
  }

  const xmlText = await res.text();
  const result = parseArxivXml(xmlText);
  setCachedSearch(cacheKey, result);
  return result;
}

/**
 * Determine if a user query would benefit from arXiv paper search.
 * Returns true for complex, academic, or research-oriented queries.
 */
export function shouldSearchArxiv(userMessage: string): boolean {
  const lower = userMessage.toLowerCase();

  let signals = 0;

  // Strong signal: explicit paper/research requests (counts as 2)
  if (
    /\b(paper|arxiv|preprint|journal|publication|cite|citation)\b/i.test(
      userMessage
    )
  ) {
    signals += 2;
  }

  // Medium signal: research-related words
  if (/\b(research|study|findings|evidence)\b/i.test(userMessage)) {
    signals += 1;
  }

  // Strong signal: advanced/specific quantum physics topics (counts as 2)
  if (
    /\b(formalism|mathematical|hamiltonian|lagrangian|hilbert space|density matrix|quantum field|decoherence|entanglement entropy|quantum error correction|topological|anyons|born rule|bell inequality|quantum channel|quantum advantage|quantum supremacy|quantum walk|quantum metrology|quantum sensing)\b/i.test(
      userMessage
    )
  ) {
    signals += 2;
  }

  // Medium signal: research state-of-the-art indicators
  if (/\b(state.of.the.art|cutting.edge|breakthrough|discovery)\b/i.test(userMessage)) {
    signals += 1;
  }

  // Weak signal: recent/latest (only counts toward total)
  if (/\b(recent|latest)\b/i.test(userMessage)) {
    signals += 1;
  }

  // Medium signal: experimental setup keywords (only with context)
  if (/\b(experiment|lab|detector|interferometer|qubit.*gate)\b/i.test(userMessage)) {
    signals += 1;
  }

  // Require at least 2 signals, or 1 strong signal to trigger arXiv search
  return signals >= 2;
}

/**
 * Build a context string from arXiv papers to inject into LLM prompts.
 */
export function buildArxivContext(papers: ArxivPaper[]): string {
  if (papers.length === 0) return "";

  const paperSummaries = papers
    .map(
      (p, i) =>
        `[Paper ${i + 1}] "${p.title}" by ${p.authors.slice(0, 3).join(", ")}${p.authors.length > 3 ? " et al." : ""}\nPublished: ${p.published.slice(0, 10)} | Categories: ${p.categories.slice(0, 3).join(", ")}\nAbstract: ${p.summary.slice(0, 500)}${p.summary.length > 500 ? "..." : ""}\nPDF: ${p.pdfUrl}`
    )
    .join("\n\n");

  return `\n\n--- Relevant Research Papers from arXiv ---\nThe following papers may be relevant to the user's question. Use them to provide accurate, research-backed answers. Cite papers by title when referencing them.\n\n${paperSummaries}\n--- End of Papers ---`;
}
