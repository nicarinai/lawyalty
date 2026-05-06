/**
 * D1 헬퍼 — Cloudflare D1 쿼리 + 타입.
 * 출처 스키마: docs/lawyalty/01-auth.md § 2
 */

export type UserRole = 'admin' | 'lawyer' | 'broker' | 'architect' | 'user';
export type UserStatus = 'pending' | 'active' | 'suspended' | 'deleted';

export interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string | null;
  role: UserRole;
  status: UserStatus;
  email_verified_at: number | null;
  phone: string | null;
  phone_verified_at: number | null;
  organization: string | null;
  license_number: string | null;
  mfa_enabled: number;
  mfa_secret: string | null;
  failed_login_count: number;
  locked_until: number | null;
  created_at: number;
  updated_at: number;
  last_login_at: number | null;
}

export interface SessionRow {
  token_hash: string;
  user_id: string;
  expires_at: number;
  refresh_until: number;
  ip: string | null;
  user_agent: string | null;
  created_at: number;
  last_used_at: number;
  revoked_at: number | null;
}

export interface AuditLogRow {
  user_id: string | null;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  ip?: string | null;
  user_agent?: string | null;
  metadata?: string | null;
}

export const Q = {
  // user
  insertUser: `
    INSERT INTO users (
      id, email, name, password_hash, role, status,
      organization, license_number,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  selectUserByEmail: `
    SELECT * FROM users WHERE email = ? COLLATE NOCASE LIMIT 1
  `,
  selectUserById: `
    SELECT * FROM users WHERE id = ? LIMIT 1
  `,
  bumpFailedLogin: `
    UPDATE users
    SET failed_login_count = failed_login_count + 1,
        locked_until = CASE
          WHEN failed_login_count + 1 >= 5
            THEN ? ELSE locked_until
        END,
        updated_at = ?
    WHERE id = ?
  `,
  resetFailedLogin: `
    UPDATE users
    SET failed_login_count = 0, locked_until = NULL,
        last_login_at = ?, updated_at = ?
    WHERE id = ?
  `,

  // session
  insertSession: `
    INSERT INTO sessions (
      token_hash, user_id, expires_at, refresh_until,
      ip, user_agent, created_at, last_used_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  selectSession: `
    SELECT * FROM sessions
    WHERE token_hash = ? AND revoked_at IS NULL
      AND expires_at > ? AND refresh_until > ?
    LIMIT 1
  `,
  touchSession: `
    UPDATE sessions
    SET last_used_at = ?, expires_at = ?
    WHERE token_hash = ?
  `,
  revokeSession: `
    UPDATE sessions SET revoked_at = ? WHERE token_hash = ?
  `,
  revokeAllUserSessions: `
    UPDATE sessions SET revoked_at = ?
    WHERE user_id = ? AND revoked_at IS NULL
  `,

  // audit
  insertAudit: `
    INSERT INTO audit_log (
      user_id, action, target_type, target_id, ip, user_agent, metadata, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
} as const;

export async function audit(
  db: D1Database,
  entry: AuditLogRow & { ts?: number }
): Promise<void> {
  const ts = entry.ts ?? Date.now();
  await db
    .prepare(Q.insertAudit)
    .bind(
      entry.user_id,
      entry.action,
      entry.target_type ?? null,
      entry.target_id ?? null,
      entry.ip ?? null,
      entry.user_agent ?? null,
      entry.metadata ?? null,
      ts
    )
    .run();
}
