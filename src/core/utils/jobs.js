/* ===========================
   Technician jobs — one shape for appointments (booked calls), repairs
   (mail-in devices) and other tickets, so "Assigned jobs" can list
   everything together.
=========================== */

export const CALL_TYPES = {
  voice: { label: "Voice call", short: "Voice" },
  video: { label: "Video call", short: "Video" },
  remote_desktop: { label: "Remote support", short: "Remote" },
};

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value).slice(0, 10)
    : d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
};

export function appointmentToJob(b) {
  const done = b.status === "completed";
  const closed = ["cancelled", "missed"].includes(b.status);
  return {
    key: `appointment-${b.id}`,
    kind: "appointment",
    id: b.id,
    reference: b.booking_reference,
    title: CALL_TYPES[b.support_type]?.label || b.support_type,
    subtitle: b.issue_summary || b.device || "",
    customer: b.customer_name,
    when: `${formatDate(b.booking_date)} · ${String(b.booking_time || "").slice(0, 5)}`,
    state: done ? "done" : closed ? "closed" : "active",
    statusLabel: b.status,
    raw: b,
  };
}

export function repairToJob(s) {
  const outcome = s.repair_outcome;
  const inRepair = s.status === "repair";
  return {
    key: `repair-${s.id}`,
    kind: "repair",
    id: s.id,
    reference: s.reference,
    title: `${s.brand || ""} ${s.device || ""}`.trim(),
    subtitle: s.diagnosis_summary || s.fault || "",
    customer: s.name,
    when: formatDate(s.created_at),
    state: inRepair && !outcome ? "active" : "done",
    statusLabel: inRepair
      ? outcome === "repaired"
        ? "repaired — with admin"
        : outcome === "unrepairable"
          ? "can't repair — with admin"
          : "in repair"
      : String(s.status || "").replace(/_/g, " "),
    raw: s,
  };
}

export function ticketToJob(t) {
  return {
    key: `ticket-${t.id}`,
    kind: "ticket",
    id: t.id,
    reference: t.ticket_code,
    title: t.device || "Support ticket",
    subtitle: t.issue || "",
    customer: t.customer_name,
    when: formatDate(t.created_at),
    state: t.status === "Completed" ? "done" : t.status === "Cancelled" ? "closed" : "active",
    statusLabel: t.status,
    raw: t,
  };
}

/**
 * Merges the three lists. Tickets that were created automatically for a
 * booking are left out — the appointment already represents that job.
 */
export function buildJobs({ appointments = [], repairs = [], tickets = [] }) {
  const bookingTicketIds = new Set(appointments.map((b) => b.ticket_id).filter(Boolean));
  const jobs = [
    ...appointments.map(appointmentToJob),
    ...repairs.map(repairToJob),
    ...tickets.filter((t) => !bookingTicketIds.has(t.id)).map(ticketToJob),
  ];
  const order = { active: 0, done: 1, closed: 2 };
  return jobs.sort((a, b) => order[a.state] - order[b.state]);
}

/** "0803 123 4567" / "+234 803…" → "2348031234567" for WhatsApp links. */
export function whatsappNumber(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) digits = `234${digits.slice(1)}`;
  return digits.length >= 10 ? digits : null;
}
