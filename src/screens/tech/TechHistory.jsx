import { MdHistory, MdStar } from "react-icons/md";
import { AppBar, EmptyState, ErrorState, List, ListItem, Screen, SkeletonList, useAsync } from "../../ui";
import api from "../../core/api/client";
import { getStoredUser } from "../../core/session";
import { formatDate, naira } from "../../lib/format";

export default function TechHistory() {
  const user = getStoredUser();
  const { data, error, loading, reload } = useAsync(() => api.get("/api/tickets", { params: { technician_id: user.id } }).then((r) => (r.data || []).filter((t) => t.status === "Completed")));

  return (
    <Screen appBar={<AppBar title="Completed jobs" back />}>
      {loading && !data ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState icon={<MdHistory />} title="Nothing completed yet" />
      ) : (
        <List>
          {data.map((t) => (
            <ListItem
              key={t.id}
              icon={<MdHistory />}
              leadTone="ok"
              over={`${t.ticket_code} · ${formatDate(t.updated_at || t.created_at)}`}
              title={t.customer_name}
              text={t.issue}
              trailing={
                <span className="stack" style={{ alignItems: "flex-end", gap: 2 }}>
                  {Number(t.amount) > 0 && <span>{naira(t.amount)}</span>}
                  {t.existing_rating && (
                    <span className="row" style={{ gap: 2, color: "#f5a623" }}>
                      <MdStar /> {t.existing_rating}
                    </span>
                  )}
                </span>
              }
            />
          ))}
        </List>
      )}
    </Screen>
  );
}
