import { ENDPOINTS, LLM, MODELS } from "@/lib/config";
import type { Target } from "./types";

// Each Groq model has its own tokens-per-minute limit, so a second model is a second bucket.
const groq = (id: string, model: string | undefined): Target => ({
  id,
  baseUrl: ENDPOINTS.groq,
  apiKey: process.env.GROQ_API_KEY,
  model,
});

const GROQ = [groq("groq", MODELS.groqChat), groq("groq-2", MODELS.groqChat2)];

const GEMINI: Target = {
  id: "gemini",
  baseUrl: ENDPOINTS.gemini,
  apiKey: process.env.GEMINI_API_KEY,
  model: MODELS.gemini,
};

// Try order. Targets without a key or model are left out.
export const TARGETS: Target[] = (LLM.primary === "gemini" ? [GEMINI, ...GROQ] : [...GROQ, GEMINI]).filter(
  (t) => t.apiKey && t.model,
);
