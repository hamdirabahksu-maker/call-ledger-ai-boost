/**
 * Simple in-memory rate limiter for server functions.
 * Resets on process restart — good enough for light abuse protection.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function assertRateLimit(
  key: string,
  opts: { limit: number; windowMs: number } = { limit: 10, windowMs: 60_000 },
): void {
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || now >= cur.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return;
  }
  cur.count += 1;
  if (cur.count > opts.limit) {
    throw new Error("Too many requests. Please wait a minute and try again.");
  }
}
