// Display formatting used across screens. Dates show in Abuja time.
const TZ = "Africa/Lagos";

export const naira = (amount) => `₦${Number(amount || 0).toLocaleString("en-NG")}`;
export const nairaFromKobo = (kobo) => naira(Number(kobo || 0) / 100);

function toDate(value) {
  if (!value) return null;
  const s = String(value);
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T12:00:00+01:00` : s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * The Abuja calendar day ("YYYY-MM-DD") of any date the API returns.
 * MySQL DATE columns arrive as timestamps whose UTC date depends on the
 * server's timezone (e.g. "2026-10-22T23:00:00Z" is the 23rd in Lagos),
 * so never take the first 10 characters.
 */
export function dayKey(value) {
  if (!value) return "";
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = toDate(s);
  if (!d) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatDate(value, opts = {}) {
  const d = toDate(value);
  if (!d) return value ? String(value) : "";
  return d.toLocaleDateString("en-NG", { timeZone: TZ, day: "numeric", month: "short", year: opts.year === false ? undefined : "numeric", weekday: opts.weekday ? "short" : undefined });
}

export function formatDateTime(value) {
  const d = toDate(value);
  if (!d) return "";
  return d.toLocaleString("en-NG", { timeZone: TZ, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

/** "14:30:00" → "2:30 pm" */
export function formatTime(value) {
  const [h, m] = String(value || "").split(":").map(Number);
  if (Number.isNaN(h)) return value || "";
  return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`;
}

export function timeAgo(value, now = new Date()) {
  const d = toDate(value);
  if (!d) return "";
  const s = Math.round((now - d) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return formatDate(d, { year: false });
}

export const fullName = (u) => [u?.first_name, u?.last_name].filter(Boolean).join(" ");

export const CALL_LABELS = { voice: "Voice call", video: "Video call", remote_desktop: "Remote support", remote: "Remote support" };

const BOOKING_TONES = { pending: "warn", confirmed: "primary", completed: "ok", cancelled: "muted", missed: "error" };
export const bookingTone = (status) => BOOKING_TONES[String(status || "").toLowerCase()] || undefined;

const TICKET_TONES = { Open: "warn", "In Progress": "primary", Pending: "warn", Completed: "ok", Cancelled: "muted" };
export const ticketTone = (status) => TICKET_TONES[status] || undefined;

const cap = (s) => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);
export const capitalize = cap;

/** "0803 123 4567" → "tel:08031234567" */
export const telHref = (phone) => `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;
