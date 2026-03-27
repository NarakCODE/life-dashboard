import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are an expert technical project manager and writer.
Your task is to help users write clear, structured, and professional project descriptions.
When given a prompt or existing draft, produce concise, actionable HTML content suitable for a rich-text editor (using <p>, <strong>, <ul>, <li>, <ol> tags only).
Do NOT wrap output in markdown code fences. Output raw HTML only.
Keep descriptions practical, specific, and well-structured.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.QWEN_API_KEY;
  const baseUrl = process.env.QWEN_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
  const model = process.env.QWEN_MODEL || "qwen-turbo";

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "QWEN_API_KEY is not configured on the server.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: { prompt?: string; existingContent?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { prompt = "", existingContent = "" } = body;

  if (!prompt.trim()) {
    return new Response(JSON.stringify({ error: "Prompt is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userMessage = existingContent.trim()
    ? `Here is the existing project description:\n${existingContent}\n\nUser request: ${prompt}\n\nImprove or expand the description based on the request. Return only the updated HTML.`
    : `Write a project description for the following:\n${prompt}\n\nReturn HTML content only.`;

  const qwenResponse = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!qwenResponse.ok) {
    const errorText = await qwenResponse.text();
    return new Response(
      JSON.stringify({
        error: `QWEN API error: ${qwenResponse.status} — ${errorText}`,
      }),
      {
        status: qwenResponse.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Stream the SSE response directly back to the client
  return new Response(qwenResponse.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
