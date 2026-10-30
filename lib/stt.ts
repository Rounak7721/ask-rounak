import { ENDPOINTS, MODELS, STT } from "@/lib/config";

export async function transcribe(audio: Blob, filename: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = MODELS.stt;
  if (!apiKey || !model) throw new Error("stt: missing API key or model");

  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", model);
  form.append("language", STT.language);
  form.append("prompt", STT.prompt);
  form.append("response_format", "verbose_json"); // adds per-segment confidence

  const res = await fetch(`${ENDPOINTS.groq}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(STT.timeoutMs),
  });

  if (!res.ok) throw new Error(`stt: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = (data.text ?? "").trim();
  if (lowConfidence(data.segments ?? [])) {
    console.info(`stt: dropped low-confidence transcript (likely noise): ${JSON.stringify(text)}`);
    return "";
  }
  return text;
}

type Segment = { avg_logprob: number; start: number; end: number };

// Duration-weighted average confidence across segments; noise like coughs scores far lower than speech.
function lowConfidence(segments: Segment[]): boolean {
  if (segments.length === 0) return false;
  const weight = (s: Segment) => Math.max(s.end - s.start, 0.01);
  const total = segments.reduce((n, s) => n + weight(s), 0);
  const avg = segments.reduce((n, s) => n + s.avg_logprob * weight(s), 0) / total;
  return avg < STT.minAvgLogprob;
}
