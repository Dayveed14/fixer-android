/* ===========================
   SCHEDULE RULES (frontend copy)
   Mirrors fixer-backend/utils/schedule.js so the pickers only offer
   times the server will accept. The server re-checks everything.

   - Working hours: 8:00 AM – 10:00 PM, Abuja time (Africa/Lagos), no
     matter what timezone the customer's device is set to.
   - Today: only slots far enough ahead of "now" are offered. At 9 PM,
     nothing is left today — the customer has to pick another day.
=========================== */

export const BUSINESS_TIMEZONE = "Africa/Lagos";
const OPEN_MINUTES = 8 * 60;
const CLOSE_MINUTES = 22 * 60;
const SLOT_INTERVAL_MINUTES = 30;
export const MAX_DAYS_AHEAD = 30;

export const LEAD_MINUTES = { booking: 60, pickup: 120 };
export const DURATION_MINUTES = { booking: 30, pickup: 60 };

const pad = (n) => String(n).padStart(2, "0");
const minutesToTime = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

export function parseTime(value) {
  if (typeof value !== "string") return null;
  const match = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Current date ("YYYY-MM-DD") and minutes since midnight in Abuja. */
export function nowInBusinessTz(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: BUSINESS_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export function toDateString(year, monthIndex, day) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

export function addDays(dateString, days) {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  const [ay, am, ad] = from.split("-").map(Number);
  const [by, bm, bd] = to.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

export function allSlots(kind = "booking") {
  const duration = DURATION_MINUTES[kind] ?? DURATION_MINUTES.booking;
  const slots = [];
  for (let m = OPEN_MINUTES; m + duration <= CLOSE_MINUTES; m += SLOT_INTERVAL_MINUTES) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

/** Start times ("HH:MM") still bookable on `date`. */
export function availableSlots(date, kind = "booking", now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return [];
  const lead = LEAD_MINUTES[kind] ?? LEAD_MINUTES.booking;
  const today = nowInBusinessTz(now);
  const diff = daysBetween(today.date, date);
  if (diff < 0 || diff > MAX_DAYS_AHEAD) return [];
  return allSlots(kind).filter((slot) => diff > 0 || parseTime(slot) >= today.minutes + lead);
}

/** Is a calendar day selectable at all (has at least one slot left)? */
export function isDateBookable(date, kind = "booking", now = new Date()) {
  return availableSlots(date, kind, now).length > 0;
}

/** First date (today or later) that still has a slot. */
export function firstBookableDate(kind = "booking", now = new Date()) {
  const today = nowInBusinessTz(now).date;
  for (let i = 0; i <= MAX_DAYS_AHEAD; i++) {
    const date = addDays(today, i);
    if (isDateBookable(date, kind, now)) return date;
  }
  return null;
}

/** "13:30" -> "1:30 PM" */
export function formatSlot(slot) {
  const minutes = parseTime(slot);
  if (minutes === null) return slot;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${period}`;
}
