const WINDOW_MS = 10 * 60_000;
const hits = new Map<string, number[]>();

// ponytail: in-memory per serverless instance, resets on cold start; move to Upstash/Supabase if abused
export function rateLimited(req: Request, bucket: string, limit: number): number {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) return Math.ceil((recent[0] + WINDOW_MS - now) / 1000);
  recent.push(now);
  hits.set(key, recent);
  return 0;
}
