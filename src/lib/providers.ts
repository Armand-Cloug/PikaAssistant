// Couche d'abstraction des fournisseurs IA.
// Un seul point d'entrée : sendMessage(provider, model, apiKey, system, history).
// Les appels passent par tauri-plugin-http (fetch côté Rust → pas de CORS).
// Ajout d'un 4e fournisseur = ajouter un case + une fonction call*.

import { fetch } from "@tauri-apps/plugin-http";
import type { ChatMessage, Provider } from "../types";

const MAX_TOKENS = 4096;

export async function sendMessage(
  provider: Provider,
  model: string,
  apiKey: string,
  system: string,
  history: ChatMessage[]
): Promise<string> {
  const msgs = history.map((m) => ({ role: m.role, content: m.content }));
  switch (provider) {
    case "anthropic":
      return callAnthropic(model, apiKey, system, msgs);
    case "openai":
      return callOpenAI(model, apiKey, system, msgs);
    case "gemini":
      return callGemini(model, apiKey, system, msgs);
  }
}

interface Msg {
  role: "user" | "assistant";
  content: string;
}

async function readJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- Anthropic
// Messages API : POST /v1/messages, auth via header x-api-key.
// https://platform.claude.com/docs — anthropic-version: 2023-06-01
async function callAnthropic(
  model: string,
  apiKey: string,
  system: string,
  messages: Msg[]
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      system,
      messages,
    }),
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(
      `Anthropic ${res.status}: ${data?.error?.message ?? res.statusText}`
    );
  }
  if (data?.stop_reason === "refusal") {
    throw new Error("Anthropic: la requête a été refusée par le modèle.");
  }
  const text = (data?.content ?? [])
    .filter((b: any) => b?.type === "text")
    .map((b: any) => b.text)
    .join("");
  if (!text) throw new Error("Anthropic: réponse vide.");
  return text;
}

// ------------------------------------------------------------------ OpenAI
// Chat Completions : POST /v1/chat/completions, auth via Bearer token.
async function callOpenAI(
  model: string,
  apiKey: string,
  system: string,
  messages: Msg[]
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(
      `OpenAI ${res.status}: ${data?.error?.message ?? res.statusText}`
    );
  }
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI: réponse vide.");
  return text;
}

// ------------------------------------------------------------------ Gemini
// Generative Language API : POST /v1beta/models/{model}:generateContent,
// auth via header x-goog-api-key. Rôles: "user" / "model".
async function callGemini(
  model: string,
  apiKey: string,
  system: string,
  messages: Msg[]
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: MAX_TOKENS },
    }),
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(
      `Gemini ${res.status}: ${data?.error?.message ?? res.statusText}`
    );
  }
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((p: any) => p?.text ?? "")
    .join("");
  if (!text) throw new Error("Gemini: réponse vide.");
  return text;
}
