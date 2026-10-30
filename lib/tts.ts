import { ENDPOINTS, MODELS, TTS } from "@/lib/config";
import { PRONUNCIATIONS, RESPELLINGS } from "./pronunciations";

// One combined regex, longest words first, so every word is replaced exactly once and
// a replacement can never be matched again by a later word.
const words = [...Object.keys(PRONUNCIATIONS), ...Object.keys(RESPELLINGS)].sort((a, b) => b.length - a.length);
const escapeRe = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PRON_RE = new RegExp(`\\b(${words.map(escapeRe).join("|")})\\b`, "g");

// Respellings are swapped in as plain text. IPA uses Deepgram's inline override,
// the JSON object wrapped in backslash-escaped braces:
//   \{"word": "Rounak", "pronounce": "rˈoʊnək"\}
function applyPronunciations(text: string): string {
  return text.replace(PRON_RE, (word) => {
    if (word in RESPELLINGS) return RESPELLINGS[word];
    const json = JSON.stringify({ word, pronounce: PRONUNCIATIONS[word] });
    return `\\${json.slice(0, -1)}\\}`;
  });
}

export async function synthesize(text: string): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.DEEPGRAM_API_KEY;
  const model = MODELS.tts;
  if (!key || !model) throw new Error("Deepgram not configured");

  // Time out only while waiting for Deepgram to answer; long replies take longer than that to stream.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TTS.timeoutMs);
  const res = await fetch(
    `${ENDPOINTS.deepgramSpeak}?model=${model}&speed=${TTS.speed}`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: applyPronunciations(text) }),
      signal: controller.signal,
    },
  ).finally(() => clearTimeout(timer));

  const warnings = res.headers.get("dg-warnings");
  if (warnings) console.warn("Deepgram warnings:", warnings);
  const applied = res.headers.get("dg-pronunciations-applied");
  if (applied) console.info("Deepgram pronunciations applied:", applied);
  if (!res.ok || !res.body) throw new Error(`Deepgram ${res.status}: ${await res.text()}`);
  return res.body;
}