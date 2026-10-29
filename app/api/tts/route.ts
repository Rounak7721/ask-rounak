import { synthesize } from "@/lib/tts";

const MAX_CHARS = 2000;

export async function GET(req: Request) {
  const text = new URL(req.url).searchParams.get("text")?.trim() ?? "";

  if (!text || text.length > MAX_CHARS) {
    return Response.json({ error: "Invalid text" }, { status: 400 });
  }

  try {
    const audio = await synthesize(text);
    return new Response(audio, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "TTS failed" }, { status: 502 });
  }
}
