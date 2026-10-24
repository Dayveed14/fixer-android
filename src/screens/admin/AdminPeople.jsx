import { useState } from "react";
import { useParams } from "react-router-dom";
import { MdPersonAdd, MdSearch, MdPersonOff } from "react-icons/md";
import { AppBar, Avatar, EmptyState, ErrorState, Fab, List, ListItem, Pill, Screen, SkeletonList, TextField, useAsync } from "../../ui";
import api from "../../core/api/client";
import { formatDate, fullName } from "../../lib/format";

export default function AdminPeople() {
  const { kind } = useParams();
  const role = kind === "technicians" ? "technician" : "user";
  const [q, setQ] = useState("");
  const { data, error, loading, reload } = useAsync(() => api.get("/api/users").then((r) => r.data));

  const list = (data || [])
    .filter((u) => u.role === role)
    .filter((u) => !q || `${fullName(u)} ${u.email} ${u.phone || ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <Screen appBar={<AppBar title={role === "technician" ? "Technicians" : "Customers"} subtitle={data ? `${(data || []).filter((u) => u.role === role).length} in total` : undefined} back />} fab={<Fab icon={<MdPersonAdd />} label="Add" to={`/a/people/new?role=${role}`} />}>
      <TextField label="Search name, email or phone" type="search" value={q} onChange={(e) => setQ(e.target.value)} trailing={<MdSearch style={{ margin: 12, fontSize: 24 }} className="muted" />} />
      {loading && !data ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState icon={<MdPersonOff />} title={q ? "No matches" : "Nobody yet"} />
      ) : (
        <List>
          {list.map((u) => (
            <ListItem key={u.id} avatar={<Avatar name={fullName(u)} />} title={fullName(u)} text={[u.email, u.phone].filter(Boolean).join(" · ")} trailing={<span className="t-body-sm">{formatDate(u.created_at, { year: false })}</span>} to={`/a/person/${u.id}`} />
          ))}
        </List>
      )}
    </Screen>
  );
}
