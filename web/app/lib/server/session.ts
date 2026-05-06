/**
 * 세션 쿠키 헬퍼.
 * - HttpOnly · Secure · SameSite=Lax
 * - Domain 은 production 에서 `.lawyalty.com` (서브도메인 공유)
 *   dev 에선 미설정 (host-only)
 */

const COOKIE_NAME = 'lawyalty_session';

export interface SessionCookieOptions {
  /** Production 일 때 `.lawyalty.com` */
  domain?: string;
  /** Default true. dev http 에선 false */
  secure?: boolean;
  /** Date 또는 maxAge 초 */
  expires?: Date;
  maxAge?: number;
}

export function buildSessionCookie(
  token: string,
  opts: SessionCookieOptions = {}
): string {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (opts.secure ?? true) parts.push('Secure');
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  if (opts.expires) parts.push(`Expires=${opts.expires.toUTCString()}`);
  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  return parts.join('; ');
}

export function buildClearSessionCookie(opts: { domain?: string; secure?: boolean } = {}): string {
  return buildSessionCookie('', {
    ...opts,
    expires: new Date(0),
    maxAge: 0,
  });
}

export function readSessionCookie(cookieHeader: string | null | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  for (const piece of cookieHeader.split(';')) {
    const [name, ...rest] = piece.trim().split('=');
    if (name === COOKIE_NAME) {
      return rest.join('=') || undefined;
    }
  }
  return undefined;
}

export { COOKIE_NAME };
