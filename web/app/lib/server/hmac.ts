export interface SsoPayload {
  email: string;
  name: string;
  role: string;
  ts: number;
}

const enc = new TextEncoder();

function canonical(p: SsoPayload): string {
  return `${p.email}|${p.name}|${p.role}|${p.ts}`;
}

export async function signSso(secret: string, p: SsoPayload): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(canonical(p)));
  return bytesToHex(new Uint8Array(mac));
}

export async function verifySso(secret: string, p: SsoPayload, sig: string): Promise<boolean> {
  const expected = await signSso(secret, p);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}
