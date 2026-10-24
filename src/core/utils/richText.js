/* ===========================
   Article / video body text → safe HTML
   New content is typed in plain textareas: blank lines start a new
   paragraph, single line breaks are kept. Older content written with
   TinyMCE is already HTML and is shown as it was.
=========================== */

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Looks like TinyMCE output (starts with / contains block-level tags).
const LEGACY_HTML = /<\s*(p|div|h[1-6]|ul|ol|li|br|strong|em|a|img|blockquote|table)\b[^>]*>/i;

// Strip the dangerous bits from legacy HTML (scripts, inline handlers,
// javascript: URLs). Content is admin-written, this is defence in depth.
function sanitizeLegacyHtml(html) {
  return String(html)
    .replace(/<\s*(script|style|iframe|object|embed)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'\s>]*\2/gi, '$1="#"');
}

export function toRichHtml(text) {
  if (!text) return "";
  if (LEGACY_HTML.test(text)) return sanitizeLegacyHtml(text);

  return String(text)
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br />")}</p>`)
    .join("");
}
