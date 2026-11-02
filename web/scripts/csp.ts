/**
 * Writes a Content-Security-Policy meta tag into every page of the static
 * export in `out/` (run by `bun run build`). The Free CloudFront plan allows
 * only managed response headers policies, so the CSP ships in the HTML. A
 * static export has no nonce: each page allows its own inline scripts by
 * hash, which change with the code, so they're computed on every build.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

import { createHash } from 'node:crypto';
import { join } from 'node:path';

const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
const CSP_META =
  /<meta http-equiv="Content-Security-Policy" content="[^"]*"\/>/;

/** The `'sha256-…'` source of each distinct inline script of a page, sorted. */
export const inlineScriptHashes = (html: string) => {
  const hashes = new Set<string>();
  for (const [, body] of html.matchAll(INLINE_SCRIPT)) {
    const digest = createHash('sha256').update(body).digest('base64');
    hashes.add(`'sha256-${digest}'`);
  }
  return [...hashes].sort();
};

/**
 * The policy: our own origin, the hashed inline scripts, Cognito and the
 * avatar bucket (the browser posts uploads straight to S3). No
 * `frame-ancestors`: browsers ignore it in a meta tag (the managed policy's
 * X-Frame-Options covers framing).
 */
export const buildCsp = (
  scriptHashes: string[],
  cognitoDomain: string,
  avatarUploadOrigin: string,
) =>
  [
    "default-src 'self'",
    `script-src 'self' ${scriptHashes.join(' ')}`,
    // Radix and next/font set inline styles.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    // Amplify talks to the user pool API and the hosted domain (Google code exchange).
    `connect-src 'self' https://cognito-idp.us-east-1.amazonaws.com https://${cognitoDomain} ${avatarUploadOrigin}`,
    `form-action 'self' https://${cognitoDomain}`,
    "base-uri 'none'",
    "object-src 'none'",
  ].join('; ');

/** The page with its policy first in `<head>`, so it covers every script. */
export const withCspMeta = (
  html: string,
  cognitoDomain: string,
  avatarUploadOrigin: string,
) => {
  const page = html.replace(CSP_META, '');
  const csp = buildCsp(
    inlineScriptHashes(page),
    cognitoDomain,
    avatarUploadOrigin,
  );
  const meta = `<meta http-equiv="Content-Security-Policy" content="${csp}"/>`;
  return page.replace('<head>', `<head>${meta}`);
};

const htmlFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });

if (import.meta.main) {
  const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  if (!cognitoDomain) throw new Error('NEXT_PUBLIC_COGNITO_DOMAIN is not set');
  const avatarUploadOrigin = process.env.AVATAR_UPLOAD_ORIGIN?.trim();
  if (!avatarUploadOrigin) throw new Error('AVATAR_UPLOAD_ORIGIN is not set');

  const files = htmlFiles('out');
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    if (!html.includes('<head>')) throw new Error(`No <head> in ${file}`);
    writeFileSync(file, withCspMeta(html, cognitoDomain, avatarUploadOrigin));
  }
  console.error(`CSP written into ${files.length} pages`);
}
