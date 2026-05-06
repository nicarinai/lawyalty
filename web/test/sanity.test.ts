import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';

describe('vitest workers pool', () => {
  it('exposes env.DB binding', () => {
    expect(env.DB).toBeDefined();
  });
});
