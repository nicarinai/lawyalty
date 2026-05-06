/**
 * 인증 유틸 — argon2id (순수 JS via @noble/hashes), 세션 발급/검증.
 *
 * Cloudflare Workers 가 런타임 WASM 컴파일을 막아서 hash-wasm 대신
 * @noble/hashes 의 순수 JS argon2id 사용. 약간 느리나 Workers 호환.
 *
 * 파라미터 (출처: docs/lawyalty/01-auth.md § 4 + OWASP minimum):
 *   t=2 iterations, m=19456 KiB, p=1
 *   운영 단계에서 m=46080 (45 MiB) 또는 m=65536 (64 MiB) 로 강화 가능.
 */

import { argon2idAsync } from '@noble/hashes/argon2.js';
import { Q, audit, type UserRow, type SessionRow } from './db';

const ARGON2_PARAMS = {
  t: 2,
  m: 19_456,
  p: 1,
  dkLen: 32,
};

const SESSION_TTL_SECONDS = 7 * 24 * 3600;
const SESSION_REFRESH_TTL_SECONDS = 30 * 24 * 3600;
const LOCK_DURATION_MS = 15 * 60 * 1000;

// ── 비밀번호 ────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < 10) throw new Error('weak_password');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await argon2idAsync(plain, salt, ARGON2_PARAMS);
  return encodePhc(salt, hash, ARGON2_PARAMS);
}

export async function verifyPassword(plain: string, encoded: string): Promise<boolean> {
  if (!encoded) return false;
  const parsed = decodePhc(encoded);
  if (!parsed) return false;
  const recomputed = await argon2idAsync(plain, parsed.salt, {
    t: parsed.t,
    m: parsed.m,
    p: parsed.p,
    dkLen: parsed.hash.length,
  });
  return constantTimeEqualsBytes(recomputed, parsed.hash);
}

// PHC 포맷: $argon2id$v=19$m=19456,t=2,p=1$<salt-b64>$<hash-b64>
function encodePhc(salt: Uint8Array, hash: Uint8Array, p: typeof ARGON2_PARAMS): string {
  return `$argon2id$v=19$m=${p.m},t=${p.t},p=${p.p}$${bytesToB64(salt)}$${bytesToB64(hash)}`;
}

function decodePhc(s: string): { salt: Uint8Array; hash: Uint8Array; t: number; m: number; p: number } | null {
  const parts = s.split('$');
  if (parts.length !== 6 || parts[1] !== 'argon2id') return null;
  const params = Object.fromEntries(parts[3].split(',').map((kv) => kv.split('=')));
  return {
    salt: b64ToBytes(parts[4]),
    hash: b64ToBytes(parts[5]),
    t: Number(params.t),
    m: Number(params.m),
    p: Number(params.p),
  };
}

// ── 세션 ────────────────────────────────────────────

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToB64Url(bytes);
}

export async function hashToken(raw: string): Promise<string> {
  const data = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToB64Url(new Uint8Array(digest));
}

export async function createSession(
  db: D1Database,
  userId: string,
  ctx: { ip?: string | null; userAgent?: string | null } = {}
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const tokenHash = await hashToken(token);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_SECONDS * 1000;
  const refreshUntil = now + SESSION_REFRESH_TTL_SECONDS * 1000;

  await db
    .prepare(Q.insertSession)
    .bind(tokenHash, userId, expiresAt, refreshUntil, ctx.ip ?? null, ctx.userAgent ?? null, now, now)
    .run();

  return { token, expiresAt: new Date(expiresAt) };
}

export async function getSessionUser(
  db: D1Database,
  token: string | undefined
): Promise<UserRow | null> {
  if (!token) return null;
  const tokenHash = await hashToken(token);
  const now = Date.now();

  const session = await db.prepare(Q.selectSession).bind(tokenHash, now, now).first<SessionRow>();
  if (!session) return null;

  const dayMs = 24 * 3600 * 1000;
  if (session.expires_at - now < dayMs) {
    const newExpires = Math.min(now + SESSION_TTL_SECONDS * 1000, session.refresh_until);
    await db.prepare(Q.touchSession).bind(now, newExpires, tokenHash).run();
  } else {
    await db
      .prepare('UPDATE sessions SET last_used_at = ? WHERE token_hash = ?')
      .bind(now, tokenHash)
      .run();
  }

  const user = await db.prepare(Q.selectUserById).bind(session.user_id).first<UserRow>();
  if (!user || user.status === 'suspended' || user.status === 'deleted') return null;
  return user;
}

export async function revokeSession(db: D1Database, token: string): Promise<void> {
  const tokenHash = await hashToken(token);
  await db.prepare(Q.revokeSession).bind(Date.now(), tokenHash).run();
}

// ── 잠금/실패 카운트 ────────────────────────────────

export async function bumpFailedLogin(db: D1Database, userId: string): Promise<void> {
  const now = Date.now();
  await db.prepare(Q.bumpFailedLogin).bind(now + LOCK_DURATION_MS, now, userId).run();
}

export async function resetFailedLogin(db: D1Database, userId: string): Promise<void> {
  const now = Date.now();
  await db.prepare(Q.resetFailedLogin).bind(now, now, userId).run();
}

// ── 유틸 ────────────────────────────────────────────

function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64ToBytes(str: string): Uint8Array {
  const pad = str.length % 4;
  const padded = pad ? str + '='.repeat(4 - pad) : str;
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64Url(bytes: Uint8Array): string {
  return bytesToB64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function constantTimeEqualsBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export { audit };
