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

  const res = await fetch(`${ENDPOINTS.groq}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(STT.timeoutMs),
  });

  if (!res.ok) throw new Error(`stt: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  return (data.text ?? "").trim();
}
