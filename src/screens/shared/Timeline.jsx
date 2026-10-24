import { MdCheck } from "react-icons/md";
import { buildTimeline, statusLabel } from "../../core/utils/shipmentStatus";
import { formatDateTime } from "../../lib/format";

/** Full vertical repair journey (customer and admin detail screens). */
export function ShipmentTimeline({ shipment }) {
  const steps = buildTimeline(shipment);
  return (
    <ol className="timeline" aria-label="Repair progress">
      {steps.map((step) => (
        <li key={step.value} className={`is-${step.state}`} aria-current={step.state === "current" ? "step" : undefined}>
          <span className="timeline__dot" aria-hidden="true">
            {step.state === "done" && <MdCheck />}
          </span>
          <div>
            <span className="timeline__label">
              {step.label}
              {step.state === "skipped" && " (skipped)"}
            </span>
            <span className="timeline__meta">{step.reachedAt ? formatDateTime(step.reachedAt) : step.state === "current" ? step.hint : ""}</span>
            {step.notes.map((n, i) => (
              <span key={i} className="timeline__note">
                {n}
              </span>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** One row of dots for list items. */
export function ProgressDots({ shipment }) {
  const steps = buildTimeline(shipment);
  return (
    <span className="dots" aria-label={statusLabel(shipment.status)}>
      {steps.map((s) => (
        <span key={s.value} className={`is-${s.state}`} />
      ))}
    </span>
  );
}

/** What the customer needs to do, if anything. */
export const needsCustomer = (s) => (s.status === "waiting_approval" && s.approval_status === "pending") || s.status === "ready_for_delivery";

export function customerStatus(s) {
  if (s.status === "waiting_approval" && s.approval_status === "pending") return { text: "Approve your quote", tone: "warn" };
  if (s.status === "waiting_approval" && s.approval_status === "approved") return { text: "Approved, repair next", tone: "primary" };
  if (s.status === "waiting_approval" && s.approval_status === "declined") return { text: "Declined, coming back", tone: "muted" };
  if (s.status === "ready_for_delivery") return { text: "Confirm when received", tone: "warn" };
  if (s.status === "delivered") return { text: "Delivered", tone: "ok" };
  if (s.status === "cancelled") return { text: "Cancelled", tone: "muted" };
  return { text: statusLabel(s.status), tone: "primary" };
}
