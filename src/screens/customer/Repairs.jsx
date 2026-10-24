import { MdAdd, MdLocalShipping } from "react-icons/md";
import { AppBar, Button, EmptyState, ErrorState, Fab, List, ListItem, Pill, Screen, SkeletonList, useAsync, useRefreshOnFocus } from "../../ui";
import { listUserShipments } from "../../core/api/shipments.api";
import { getStoredUser } from "../../core/session";
import { formatDate } from "../../lib/format";
import { ProgressDots, customerStatus, needsCustomer } from "../shared/Timeline";

export default function Repairs() {
  const user = getStoredUser();
  const { data, error, loading, reload } = useAsync(async () => {
    try {
      const list = await listUserShipments(user.email);
      return Array.isArray(list) ? list : [];
    } catch (err) {
      if (err.status === 404) return [];
      throw err;
    }
  });
  useRefreshOnFocus(reload);

  const list = (data || []).slice().sort((a, b) => Number(needsCustomer(b)) - Number(needsCustomer(a)));

  return (
    <Screen appBar={<AppBar title="Repairs" subtitle="Devices you've sent in" />} fab={list.length > 0 && <Fab icon={<MdAdd />} label="Book pickup" to="/c/pickup" />}>
      {loading && !data ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState icon={<MdLocalShipping />} title="No repairs yet" action={<Button to="/c/pickup">Book a pickup</Button>}>
          Send a device in and track it from pickup to delivery here.
        </EmptyState>
      ) : (
        <List>
          {list.map((s) => {
            const st = customerStatus(s);
            return (
              <ListItem
                key={s.id}
                icon={<MdLocalShipping />}
                leadTone={needsCustomer(s) ? "warn" : s.status === "delivered" ? "ok" : undefined}
                over={`${s.reference} · ${formatDate(s.created_at, { year: false })}`}
                title={`${s.brand || ""} ${s.device || ""}`.trim()}
                text={
                  <span className="stack" style={{ gap: 6, marginTop: 4 }}>
                    <Pill tone={st.tone}>{st.text}</Pill>
                    <ProgressDots shipment={s} />
                  </span>
                }
                to={`/c/repairs/${s.id}`}
              />
            );
          })}
        </List>
      )}
    </Screen>
  );
}
