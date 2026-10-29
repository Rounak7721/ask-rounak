import { SYSTEM_PROMPT } from "@/lib/persona";
import { chatCompletion } from "./openaiCompatible";
import { PROVIDERS } from "./providers";
import type { ChatMessage, LLMResult, ProviderName } from "./types";

export async function chatWithFallback(messages: ChatMessage[]): Promise<LLMResult> {
  const primary: ProviderName = process.env.LLM_PROVIDER === "gemini" ? "gemini" : "groq";
  const order: ProviderName[] = primary === "groq" ? ["groq", "gemini"] : ["gemini", "groq"];

  for (const name of order) {
    try {
      const reply = await chatCompletion(PROVIDERS[name], SYSTEM_PROMPT, messages);
      return { reply, provider: name };
    } catch (err) {
      console.error(`LLM ${name} failed:`, err);
    }
  }
  throw new Error("All LLM providers failed");
}
