import { transcribe } from "@/lib/stt";
import { rateLimited } from "@/lib/rateLimit";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const wait = rateLimited(req, "transcribe", 30);
  if (wait) return Response.json({ error: "Too many requests", retryAfter: wait }, { status: 429 });
  const form = await req.formData().catch(() => null);
  const audio = form?.get("audio");

  if (!(audio instanceof Blob) || audio.size === 0 || audio.size > MAX_BYTES) {
    return Response.json({ error: "Invalid audio" }, { status: 400 });
  }

  const ext = audio.type.includes("mp4") ? "mp4" : audio.type.includes("ogg") ? "ogg" : "webm";

  try {
    const text = await transcribe(audio, `audio.${ext}`);
    return Response.json({ text });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Transcription failed" }, { status: 502 });
  }
}
