import { google } from "@ai-sdk/google";
import { streamText } from "ai";

const systemPrompt = `You are Gemini, an AI-powered quantum physics tutor for the "Quantum: The Easy Way" learning platform. 

Your role:
- Explain quantum physics concepts clearly, from beginner to advanced level
- Use analogies and real-world examples to make abstract concepts tangible
- Cover all major topics: superposition, entanglement, wave-particle duality, quantum computing, quantum tunneling, the observer effect, wave functions, Schrödinger's cat, and quantum tools
- When appropriate, mention mathematical formulations but always explain them in plain language first
- Be encouraging and enthusiastic about the subject
- If a question is outside quantum physics, politely redirect to quantum topics

Keep responses focused, educational, and engaging. Use markdown formatting for readability (headers, bullet points, bold for key terms).`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: google("gemini-2.0-flash"),
      system: systemPrompt,
      messages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Check for quota / rate-limit errors
    const isQuotaError =
      message.includes("quota") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.includes("429") ||
      message.includes("exceeded");

    const isApiKeyError =
      message.includes("API key") ||
      message.includes("UNAUTHENTICATED") ||
      message.includes("403");

    return new Response(
      JSON.stringify({
        error: true,
        type: isQuotaError
          ? "quota_exceeded"
          : isApiKeyError
            ? "api_key_invalid"
            : "server_error",
        message: isQuotaError
          ? "Your Gemini API quota has been exceeded. Please wait until it resets (daily at midnight Pacific Time) or check your billing at aistudio.google.com."
          : isApiKeyError
            ? "Invalid or missing API key. Please check your GOOGLE_GENERATIVE_AI_API_KEY in .env.local."
            : `Something went wrong: ${message}`,
      }),
      {
        status: isQuotaError ? 429 : isApiKeyError ? 401 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
