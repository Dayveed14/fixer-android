// Shipment lifecycle as the customer and admin see it. Mirrors
// fixer-backend/services/shipmentLifecycle.js.

export const SHIPMENT_STEPS = [
  { value: "pickup_scheduled", label: "Pickup scheduled", hint: "Booked and paid" },
  { value: "courier_assigned", label: "Courier assigned", hint: "A rider is on the way" },
  { value: "device_collected", label: "Device collected", hint: "Heading to our Wuse workshop" },
  { value: "diagnosis", label: "Diagnosis", hint: "Technicians are checking it" },
  { value: "waiting_approval", label: "Waiting for approval", hint: "Your quote is ready" },
  { value: "repair", label: "Repair", hint: "Being fixed" },
  { value: "quality_check", label: "Quality check", hint: "Final tests" },
  { value: "ready_for_delivery", label: "Ready for delivery", hint: "On its way back to you" },
  { value: "delivered", label: "Delivered", hint: "Back in your hands" },
];

export const STATUS_LABELS = Object.fromEntries([
  ...SHIPMENT_STEPS.map((s) => [s.value, s.label]),
  ["cancelled", "Cancelled"],
]);

export const statusLabel = (status) => STATUS_LABELS[status] || status;

export const naira = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

/**
 * Builds the timeline: one entry per step with its state
 * ("done" | "current" | "upcoming" | "skipped") and when it happened.
 */
export function buildTimeline(shipment) {
  const events = Array.isArray(shipment?.events) ? shipment.events : [];
  const status = shipment?.status;
  const declined = shipment?.approval_status === "declined";
  const currentIndex = SHIPMENT_STEPS.findIndex((s) => s.value === status);

  return SHIPMENT_STEPS.map((step, index) => {
    const reachedAt = events.find((e) => e.status === step.value)?.created_at || null;
    const notes = events.filter((e) => e.status === step.value && e.note).map((e) => e.note);
    let state;

    if (status === "cancelled") {
      state = reachedAt ? "done" : "skipped";
    } else if (declined && (step.value === "repair" || step.value === "quality_check")) {
      state = "skipped";
    } else if (index < currentIndex) {
      state = "done";
    } else if (index === currentIndex) {
      state = status === "delivered" ? "done" : "current";
    } else {
      state = "upcoming";
    }

    return { ...step, state, reachedAt, notes };
  });
}

/** Hours/minutes left until `deadline`, or null once it's passed. */
export function timeLeft(deadline, now = new Date()) {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - now.getTime();
  if (!(ms > 0)) return null;
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
