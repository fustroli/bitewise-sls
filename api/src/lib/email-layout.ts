/**
 * The branded layout every Cognito email uses: wordmark, card with heading, paragraphs and the
 * code, then a footer. Ported from bitewise-backend's mail layout with a code in place of the
 * link button. Inline styles and tables only, no external resources. Cognito sends one HTML body,
 * so there's no text version.
 */
export interface LayoutInput {
  subject: string;
  // Inbox preview text, hidden in the body
  preheader: string;
  heading: string;
  paragraphs: string[];
  // Cognito's placeholder ({####}); Cognito swaps in the real code after this Lambda returns
  code: string;
  // Shown under the code
  codeNote: string;
  // Why the recipient got this email
  reason: string;
}

// From bitewise-frontend's globals.css (light theme)
const COLOR = {
  page: '#f3f4f1',
  card: '#ffffff',
  border: '#e3e6e0',
  text: '#18211c',
  muted: '#5b675f',
  primary: '#1e6b47',
  accent: '#e5f0e9',
  accentText: '#17593a',
};
const FONT = "Manrope, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

const NO_REPLY = "This is an automated message; replies aren't read.";

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes text for HTML element content and quoted attribute values. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}

export function renderLayout(input: LayoutInput, appUrl: string): string {
  const e = escapeHtml;
  const { subject, preheader, heading, paragraphs, code, codeNote, reason } = input;

  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:${COLOR.text};">${e(p)}</p>`)
    .join('\n');

  // The code is not escaped: Cognito must find its placeholder verbatim.
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${e(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${e(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.page};font-family:${FONT};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
<tr><td style="padding:0 8px 20px;font-size:24px;font-weight:700;letter-spacing:-0.5px;color:${COLOR.text};">BiteWise<span style="color:${COLOR.primary};">.</span></td></tr>
<tr><td style="background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:14px;padding:32px;">
<h1 style="margin:0 0 16px;font-size:22px;line-height:30px;font-weight:700;color:${COLOR.text};">${e(heading)}</h1>
${body}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;">
<tr><td align="center" bgcolor="${COLOR.accent}" style="border-radius:12px;background:${COLOR.accent};padding:14px 28px;font-family:${MONO};font-size:28px;font-weight:700;letter-spacing:6px;line-height:36px;color:${COLOR.accentText};">${code}</td></tr>
</table>
<p style="margin:0;font-size:13px;line-height:20px;color:${COLOR.muted};">${e(codeNote)}</p>
</td></tr>
<tr><td align="center" style="padding:24px 8px 0;font-size:12px;line-height:18px;color:${COLOR.muted};">
<p style="margin:0 0 8px;">${e(reason)}</p>
<p style="margin:0 0 8px;">${e(NO_REPLY)}</p>
<p style="margin:0;"><a href="${e(appUrl)}" target="_blank" style="color:${COLOR.muted};">BiteWise · ${e(new URL(appUrl).host)}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
