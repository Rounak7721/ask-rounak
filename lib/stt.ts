export async function transcribe(audio: Blob, filename: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_STT_MODEL;
    if (!apiKey || !model) throw new Error("stt: missing API key or model");

    const form = new FormData();
    form.append("file", audio, filename);
    form.append("model", model);
    form.append("language", "en");
    form.append("prompt", "Interview questions for Rounak about ClauseGuard, MindDesk, IRIS, 100x, Kolhapur, Goa, AI agents.");


    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) throw new Error(`stt: HTTP ${res.status} ${await res.text()}`);
    const data = await res.json();
    return (data.text ?? "").trim();
}
