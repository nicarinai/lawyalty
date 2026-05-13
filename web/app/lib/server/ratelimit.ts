export interface RateLimitOpts {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export async function rateLimit(kv: KVNamespace, opts: RateLimitOpts): Promise<RateLimitResult> {
  const now = Date.now();
  const raw = await kv.get(opts.key);
  let data: Bucket | null = raw ? (JSON.parse(raw) as Bucket) : null;
  if (!data || data.resetAt <= now) {
    data = { count: 0, resetAt: now + opts.windowMs };
  }
  data.count += 1;
  const ttl = Math.max(Math.ceil((data.resetAt - now) / 1000), 60);
  await kv.put(opts.key, JSON.stringify(data), { expirationTtl: ttl });
  if (data.count > opts.limit) {
    return { allowed: false, remaining: 0, retryAfterSec: Math.ceil((data.resetAt - now) / 1000) };
  }
  return { allowed: true, remaining: opts.limit - data.count, retryAfterSec: 0 };
}
