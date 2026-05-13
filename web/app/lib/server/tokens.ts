import { Q, type OneTimeTokenRow, type TokenPurpose } from './db';
import { hashToken } from './auth';

export async function issueToken(
  db: D1Database,
  { userId, purpose, ttlMs }: { userId: string; purpose: TokenPurpose; ttlMs: number },
): Promise<string> {
  const raw = bytesToB64Url(crypto.getRandomValues(new Uint8Array(32)));
  const hash = await hashToken(raw);
  const now = Date.now();
  await db
    .prepare(Q.insertOneTimeToken)
    .bind(hash, userId, purpose, now + ttlMs, now)
    .run();
  return raw;
}

export type ConsumeResult =
  | { userId: string; error?: undefined }
  | { userId?: undefined; error: 'not_found' | 'already_used' | 'expired' | 'purpose_mismatch' };

export async function consumeToken(
  db: D1Database,
  raw: string,
  expectedPurpose: TokenPurpose,
): Promise<ConsumeResult> {
  const hash = await hashToken(raw);
  const row = await db.prepare(Q.selectOneTimeTokenByHash).bind(hash).first<OneTimeTokenRow>();
  if (!row) return { error: 'not_found' };
  if (row.used_at != null) return { error: 'already_used' };
  if (row.expires_at < Date.now()) return { error: 'expired' };
  if (row.purpose !== expectedPurpose) return { error: 'purpose_mismatch' };
  await db.prepare(Q.consumeOneTimeToken).bind(Date.now(), hash).run();
  return { userId: row.user_id };
}

function bytesToB64Url(b: Uint8Array): string {
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
