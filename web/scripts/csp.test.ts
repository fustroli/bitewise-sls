import { buildCsp, inlineScriptHashes, withCspMeta } from './csp';
import { describe, expect, it } from 'vitest';

import { createHash } from 'node:crypto';

const sha = (body: string) =>
  `'sha256-${createHash('sha256').update(body).digest('base64')}'`;

const PAGE =
  '<!DOCTYPE html><html><head><meta charset="utf-8"/><script>b()</script>' +
  '<script src="/x.js"></script></head><body><script id="t">a()</script></body></html>';

describe('inlineScriptHashes', () => {
  it("hashes a page's inline scripts once each, sorted, and skips external ones", () => {
    expect(inlineScriptHashes(`${PAGE}<script>a()</script>`)).toEqual(
      [sha('b()'), sha('a()')].sort(),
    );
  });
});

describe('buildCsp', () => {
  it('allows only our own scripts, the hashed inline ones, Cognito and the avatar bucket', () => {
    const csp = buildCsp(
      ["'sha256-abc'"],
      'auth.example.com',
      'https://avatars.s3.example.com',
    );

    expect(csp).toContain("script-src 'self' 'sha256-abc';");
    expect(csp).toContain(
      "connect-src 'self' https://cognito-idp.us-east-1.amazonaws.com https://auth.example.com https://avatars.s3.example.com;",
    );
    expect(csp).not.toContain('unsafe-eval');
    // Ignored in a meta tag; X-Frame-Options covers it.
    expect(csp).not.toContain('frame-ancestors');
  });
});

describe('withCspMeta', () => {
  it('puts the policy first in the head, before any script', () => {
    const html = withCspMeta(
      PAGE,
      'auth.example.com',
      'https://avatars.s3.example.com',
    );
    const meta = html.indexOf('http-equiv="Content-Security-Policy"');

    expect(meta).toBeGreaterThan(html.indexOf('<head>'));
    expect(meta).toBeLessThan(html.indexOf('<script'));
    expect(html).toContain(sha('a()'));
  });

  it('replaces the policy of an earlier run instead of adding another', () => {
    const once = withCspMeta(
      PAGE,
      'auth.example.com',
      'https://avatars.s3.example.com',
    );

    expect(
      withCspMeta(once, 'auth.example.com', 'https://avatars.s3.example.com'),
    ).toBe(once);
  });
});
