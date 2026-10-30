import { transcribe } from "@/lib/stt";
import { rateLimited } from "@/lib/rateLimit";
import { STT, RATE_LIMIT } from "@/lib/config";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");

  if (!(audio instanceof Blob) || audio.size === 0 || audio.size > STT.maxBytes) {
    return Response.json({ error: "Invalid audio" }, { status: 400 });
  }

  const ext = audio.type.includes("wav") ? "wav" : audio.type.includes("mp4") ? "mp4" : audio.type.includes("ogg") ? "ogg" : "webm";
  const wait = rateLimited(req, "transcribe", RATE_LIMIT.transcribe);
  if (wait) return Response.json({ error: "Too many requests", retryAfter: wait }, { status: 429 });

  try {
    const text = await transcribe(audio, `audio.${ext}`);
    return Response.json({ text });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Transcription failed" }, { status: 502 });
  }
}
