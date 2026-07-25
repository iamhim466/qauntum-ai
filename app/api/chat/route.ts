import { NextResponse } from "next/server";

// ── System Prompt ──────────────────────────────────────────────────
const systemPrompt = `You are a helpful AI tutor for the "Quantum: The Easy Way" learning platform. You help users understand quantum physics concepts clearly and accurately. Adapt your explanations to the user's level — use simple analogies for beginners, and rigorous technical detail for advanced users. Always be encouraging and make quantum physics feel accessible.`;

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
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
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
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
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
    const { messages, modelType } = body as {
      messages: { role: string; content: string }[];
      modelType?: "fast" | "reasoning";
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required and must not be empty." },
        { status: 400 }
      );
    }

    // Route to the appropriate provider
    const useReasoning = modelType === "reasoning";

    const stream = useReasoning
      ? await callCloudflare(messages)
      : await callGroq(messages);

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
