import { useState } from "react";
import { MdLocalShipping, MdDoneAll } from "react-icons/md";
import { AppBar, Chip, EmptyState, ErrorState, List, ListItem, Pill, Screen, SkeletonList, useAsync, useRefreshOnFocus } from "../../ui";
import { listShipments } from "../../core/api/shipments.api";
import { statusLabel } from "../../core/utils/shipmentStatus";
import { formatDate } from "../../lib/format";
import { ProgressDots } from "../shared/Timeline";

/** What the admin should do next with a shipment, or null if nothing. */
export function adminNeeds(s) {
  const a = s.next_actions || {};
  if (a.can_quote && s.status === "diagnosis") return "Send quote";
  if (a.needs_technician) return "Start repair";
  if (a.awaiting_customer) return null;
  if (a.awaiting_technician) return null;
  if (s.status === "repair" && s.repair_outcome) return s.repair_outcome === "repaired" ? "Repaired: quality check" : "Can't repair: send back";
  if (s.status === "waiting_approval" && s.approval_status === "declined") return "Declined: send back";
  if (["pickup_scheduled", "courier_assigned", "device_collected", "quality_check"].includes(s.status)) return "Move on";
  return null;
}

function waiting(s) {
  const a = s.next_actions || {};
  if (a.awaiting_customer) return "Waiting for customer";
  if (a.awaiting_technician) return "With technician";
  if (s.status === "ready_for_delivery") return "Out for delivery";
  return null;
}

export default function AdminRepairs() {
  const [filter, setFilter] = useState("action");
  const { data, error, loading, reload } = useAsync(listShipments);
  useRefreshOnFocus(reload);

  const all = data || [];
  const visible = all.filter((s) =>
    filter === "action" ? adminNeeds(s) : filter === "open" ? !["delivered", "cancelled"].includes(s.status) : true,
  );

  return (
    <Screen appBar={<AppBar title="Repairs" subtitle="Mail-in devices" />}>
      <div className="chips">
        <Chip selected={filter === "action"} onClick={() => setFilter("action")}>
          Needs action ({all.filter(adminNeeds).length})
        </Chip>
        <Chip selected={filter === "open"} onClick={() => setFilter("open")}>
          In progress
        </Chip>
        <Chip selected={filter === "all"} onClick={() => setFilter("all")}>
          All
        </Chip>
      </div>
      {loading && !data ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState icon={<MdDoneAll />} title={filter === "action" ? "Nothing needs you" : "No repairs"} />
      ) : (
        <List>
          {visible.map((s) => {
            const need = adminNeeds(s);
            const wait = waiting(s);
            return (
              <ListItem
                key={s.id}
                icon={<MdLocalShipping />}
                leadTone={need ? "warn" : s.status === "delivered" ? "ok" : undefined}
                over={`${s.reference} · ${s.name} · ${formatDate(s.created_at, { year: false })}`}
                title={`${s.brand || ""} ${s.device || ""}`.trim()}
                text={
                  <span className="stack" style={{ gap: 6, marginTop: 4 }}>
                    <span className="row" style={{ flexWrap: "wrap" }}>
                      <Pill tone={need ? "warn" : "primary"}>{need || wait || statusLabel(s.status)}</Pill>
                    </span>
                    <ProgressDots shipment={s} />
                  </span>
                }
                to={`/a/repairs/${s.id}`}
              />
            );
          })}
        </List>
      )}
    </Screen>
  );
}
