import { NextResponse } from "next/server";
import {
  searchArxiv,
  shouldSearchArxiv,
  buildArxivContext,
  type ArxivPaper,
} from "@/lib/arxiv";

// ── System Prompt ──────────────────────────────────────────────────
type LevelType = "beginner" | "intermediate" | "advanced";

const levelInstructions: Record<LevelType, string> = {
  beginner: `The user is a BEGINNER with little or no physics background. Explain using simple everyday analogies and metaphors. Avoid jargon — if you must use a technical term, define it immediately in plain language. Use short sentences, concrete examples, and relatable comparisons (e.g. "Imagine a coin spinning in the air..."). Keep the tone warm and encouraging. Aim for clarity over completeness.`,
  intermediate: `The user has an INTERMEDIATE understanding — they know basic physics concepts and some quantum terminology. Provide a balanced explanation that includes both intuitive reasoning and key technical details. You may use equations briefly but always explain what they mean in words. Include real-world applications and connect concepts to what they may already know. Aim for depth without overwhelming them.`,
  advanced: `The user is ADVANCED — they have a strong physics or math background. Provide rigorous, technically precise explanations. Include mathematical formalism, equations, and formal definitions. Reference specific principles, theorems, and experimental results. Use proper quantum mechanics notation (Dirac notation, operators, etc.) where appropriate. Do not oversimplify — assume the reader can handle complexity.`,
};

function buildSystemPrompt(level?: LevelType): string {
  const base = `You are a helpful AI tutor for the "Quantum: The Easy Way" learning platform. You help users understand quantum physics concepts clearly and accurately. Always be encouraging and make quantum physics feel accessible.`;
  if (level && levelInstructions[level]) {
    return base + `\n\n${levelInstructions[level]}`;
  }
  return base;
}

// arXiv context builder (used inline in POST handler)
function buildArxivPrompt(papers: ArxivPaper[], level?: LevelType): string {
  return buildSystemPrompt(level) +
    buildArxivContext(papers) +
    `\nWhen referencing papers above, cite them by title. If the papers don't directly answer the question, still use your general knowledge but mention if recent research trends are relevant.`;
}



// ── Groq (Fast Q&A) ───────────────────────────────────────────────
async function callGroq(messages: { role: string; content: string }[]) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY in environment variables.");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error (${res.status}): ${err}`);
  }

  return res.body!;
}

// ── Cloudflare Workers AI (Deep Reasoning) ─────────────────────────
async function callCloudflare(messages: { role: string; content: string }[]) {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!apiToken || !accountId) {
    throw new Error("Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID in environment variables.");
  }

  const model = "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b";
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      messages,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudflare API error (${res.status}): ${err}`);
  }

  return res.body!;
}

// ── POST Handler ───────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, modelType, level } = body as {
      messages: { role: string; content: string }[];
      modelType?: "fast" | "reasoning";
      level?: LevelType;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required and must not be empty." },
        { status: 400 }
      );
    }

    // ── Smart arXiv Integration ──────────────────────────────
    // Only search arXiv when the query is complex/academic
    // to respect rate limits and keep simple queries fast.
    const lastUserMessage = messages[messages.length - 1]?.content ?? "";
    const useArxiv = shouldSearchArxiv(lastUserMessage);

    let systemMsg = { role: "system", content: buildSystemPrompt(level) };
    if (useArxiv) {
      try {
        // Extract key terms from the user's message for arXiv search
        const searchTerms = lastUserMessage
          .replace(/\b(explain|describe|tell me about|what is|how does|how do|why|can you|please)\b/gi, "")
          .trim()
          .slice(0, 120);

        if (searchTerms.length > 5) {
          const { papers } = await searchArxiv(searchTerms, 4);
          if (papers.length > 0) {
            systemMsg = {
              role: "system",
              content: buildArxivPrompt(papers, level),
            };
            console.log(`[/api/chat] arXiv: injected ${papers.length} papers for query: "${searchTerms.slice(0, 60)}..."`);
          }
        }
      } catch (arxivErr) {
        // Don't fail the whole request if arXiv search fails
        console.warn("[/api/chat] arXiv search failed, proceeding without papers:",
          arxivErr instanceof Error ? arxivErr.message : arxivErr
        );
      }
    }

    // Route to the appropriate provider
    const useReasoning = modelType === "reasoning";
    const augmentedMessages = [systemMsg, ...messages];

    const stream = useReasoning
      ? await callCloudflare(augmentedMessages)
      : await callGroq(augmentedMessages);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[/api/chat] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
