export const INPUT_MODES = ["voice", "live", "chip", "text"] as const;
export type InputMode = (typeof INPUT_MODES)[number];

export type QALog = {
  sessionId: string;
  inputMode?: InputMode;
  provider?: string;
  question: string;
  answer: string;
};

export async function logQA(entry: QALog): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    const res = await fetch(`${url}/rest/v1/qa_log`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        session_id: entry.sessionId,
        input_mode: entry.inputMode,
        provider: entry.provider,
        question: entry.question,
        answer: entry.answer,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error(`Supabase log ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error("Supabase log failed:", err);
  }
}
