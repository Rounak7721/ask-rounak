// Every tunable setting in one place: endpoints, models, model parameters, timeouts and limits.
// No secrets here: browser code imports this file too. API keys are read from env only in server files.

export const SITE_URL = "https://ask.rounak.co";

export const ENDPOINTS = {
  groq: "https://api.groq.com/openai/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  deepgramSpeak: "https://api.deepgram.com/v1/speak",
  // Voice activity detection assets. Keep the versions in step with package.json.
  vadAssets: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.31/dist/",
  onnxWasm: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/",
};

// Model IDs come only from env vars (.env.local and Vercel), so they can change without a code change.
export const MODELS = {
  groqChat: process.env.GROQ_CHAT_MODEL,
  groqChat2: process.env.GROQ_CHAT_MODEL_2, // second Groq model = a second tokens-per-minute bucket
  gemini: process.env.GEMINI_MODEL,
  stt: process.env.GROQ_STT_MODEL,
  tts: process.env.DEEPGRAM_TTS_MODEL,
};

export const LLM = {
  primary: process.env.LLM_PROVIDER === "gemini" ? "gemini" : "groq",
  reasoningEffort: "low",
  temperature: 0.4,
  // Safety net against runaway replies (counts reasoning tokens too); normal replies use < 300.
  maxCompletionTokens: 1200,
  timeoutMs: 15_000,
  // For the rate-limit estimate: ≈4 characters per token, plus room for the reply.
  charsPerToken: 4,
  replyAllowanceTokens: 600,
};

export const CHAT = {
  historyMessages: 10, // only the last 10 messages are sent and used
  maxMessageChars: 2000, // longer history messages are clipped, not rejected
};

export const STT = {
  language: "en",
  // Vocabulary hint so Whisper spells names right.
  prompt: "Interview questions for Rounak about ClauseGuard, MindDesk, IRIS, 100x, Kolhapur, Goa, AI agents.",
  maxBytes: 4 * 1024 * 1024,
  timeoutMs: 15_000,
  // Whisper invents whole sentences from coughs and noise. Measured average log-probability:
  // noise ≈ -1.4, real speech -0.2 to -0.5 (even short or noisy). Below this, the transcript is dropped.
  minAvgLogprob: -1.0,
};

// Voice activity detection (voice mode). Stricter than the library defaults (0.3 / 0.25 / 400 ms),
// so coughs and bumps don't count as speech or cut the bot off mid-reply.
export const VAD = {
  positiveSpeechThreshold: 0.5, // speech probability a frame needs to count as speech
  negativeSpeechThreshold: 0.35, // below this, speech has stopped (Silero suggests 0.15 under positive)
  minSpeechMs: 600, // shorter bursts are ignored and don't interrupt
};

export const TTS = {
  speed: "1.0",
  maxChars: 2000,
  timeoutMs: 15_000, // only the wait for Deepgram to answer; streaming takes longer
};

export const LOG_TIMEOUT_MS = 5000;

// Requests per IP per window, per route.
export const RATE_LIMIT = {
  windowMs: 10 * 60_000,
  chat: 30,
  transcribe: 30,
  tts: 60,
};

// Dictation (tap to talk).
export const RECORDING = {
  maxMs: 60_000,
  minMs: 1_000, // shorter taps are ignored
  speechRms: 0.02, // below this loudness the clip counts as silence
};
