import { useState } from "react";
import { MdConfirmationNumber, MdDoneAll } from "react-icons/md";
import { AppBar, Chip, EmptyState, ErrorState, List, ListItem, Pill, Screen, SkeletonList, useAsync, useRefreshOnFocus } from "../../ui";
import api from "../../core/api/client";
import { formatDate, ticketTone } from "../../lib/format";

const FILTERS = ["Open", "In Progress", "Pending", "Completed"];

export default function AdminTickets() {
  const [status, setStatus] = useState("active");
  const { data, error, loading, reload } = useAsync(() => api.get("/api/tickets").then((r) => r.data));
  useRefreshOnFocus(reload);

  const all = data || [];
  const visible = all.filter((t) => (status === "active" ? t.status !== "Completed" : status === "all" ? true : t.status === status));

  return (
    <Screen appBar={<AppBar title="Support tickets" />}>
      <div className="chips chips--scroll">
        <Chip selected={status === "active"} onClick={() => setStatus("active")}>
          Not done ({all.filter((t) => t.status !== "Completed").length})
        </Chip>
        {FILTERS.map((s) => (
          <Chip key={s} selected={status === s} onClick={() => setStatus(s)}>
            {s}
          </Chip>
        ))}
        <Chip selected={status === "all"} onClick={() => setStatus("all")}>
          All
        </Chip>
      </div>
      {loading && !data ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState icon={<MdDoneAll />} title="No tickets here" />
      ) : (
        <List>
          {visible.map((t) => (
            <ListItem
              key={t.id}
              icon={<MdConfirmationNumber />}
              leadTone={!t.technician_id && t.status !== "Completed" ? "warn" : undefined}
              over={`${t.ticket_code} · ${formatDate(t.created_at, { year: false })}${t.priority ? ` · ${t.priority}` : ""}`}
              title={t.customer_name}
              text={`${t.issue}${t.technician_name ? ` · ${t.technician_name}` : " · Unassigned"}`}
              trailing={<Pill tone={ticketTone(t.status)}>{t.status}</Pill>}
              to={`/a/tickets/${t.id}`}
            />
          ))}
        </List>
      )}
    </Screen>
  );
}
