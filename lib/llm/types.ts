export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ProviderName = "groq" | "gemini";

export type Provider = {
  name: ProviderName;
  baseUrl: string;
  apiKey: string | undefined;
  model: string | undefined;
};

export type LLMResult = { reply: string; provider: ProviderName };
