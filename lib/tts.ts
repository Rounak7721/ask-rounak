import { PRONUNCIATIONS } from "./pronunciations";

function applyPronunciations(text: string): string {
  let out = text;
  for (const [word, ipa] of Object.entries(PRONUNCIATIONS)) {
    const pron = JSON.stringify({ word, pronounce: ipa });
    out = out.replace(new RegExp(`\\b${word}\\b`, "g"), pron);
  }
  return out;
}

export async function synthesize(text: string): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.DEEPGRAM_API_KEY;
  const model = process.env.DEEPGRAM_TTS_MODEL;
  if (!key || !model) throw new Error("Deepgram not configured");

  const res = await fetch(
    `https://api.deepgram.com/v1/speak?model=${model}&speed=1.0`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: applyPronunciations(text) }),
      signal: AbortSignal.timeout(15000),
    },
  );

  const warnings = res.headers.get("dg-warnings");
  if (warnings) console.warn("Deepgram warnings:", warnings);
  if (!res.ok || !res.body) throw new Error(`Deepgram ${res.status}: ${await res.text()}`);
  return res.body;
}
