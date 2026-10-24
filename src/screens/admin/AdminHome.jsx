import { useNavigate } from "react-router-dom";
import { MdNotificationsNone, MdPeople, MdEngineering, MdConfirmationNumber, MdPayments, MdBuild, MdWarningAmber, MdLocalShipping, MdEventNote, MdChevronRight, MdSmartToy, MdPriceChange } from "react-icons/md";
import { AppBar, Card, IconButton, List, ListItem, Screen, Section, StatTile, useAsync, useRefreshOnFocus } from "../../ui";
import api from "../../core/api/client";
import { listShipments } from "../../core/api/shipments.api";
import { getStoredUser } from "../../core/session";
import { useNotifications } from "../../core/notifications";
import { naira } from "../../lib/format";
import { adminNeeds } from "./AdminRepairs";

export default function AdminHome() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const { unread } = useNotifications();

  const { data, reload } = useAsync(async () => {
    const [stats, shipments, bookings, metrics] = await Promise.allSettled([
      api.get("/api/stats/dashboard").then((r) => r.data),
      listShipments(),
      api.get("/api/bookings").then((r) => r.data),
      api.get("/api/health/metrics").then((r) => r.data),
    ]);
    return {
      stats: stats.status === "fulfilled" ? stats.value : {},
      shipments: shipments.status === "fulfilled" ? shipments.value : [],
      bookings: bookings.status === "fulfilled" ? bookings.value : [],
      metrics: metrics.status === "fulfilled" ? metrics.value : null,
    };
  });
  useRefreshOnFocus(reload);

  const s = data?.stats || {};
  const repairsToAct = (data?.shipments || []).filter((x) => adminNeeds(x));
  const unassigned = (data?.bookings || []).filter((b) => !b.technician_id && !["cancelled", "completed", "missed"].includes(String(b.status).toLowerCase()));
  const unused = data?.metrics?.payments?.unfulfilled || 0;
  const serverErrors = data?.metrics?.server_errors_last_5_min || 0;

  return (
    <Screen appBar={<AppBar variant="brand" logo actions={<IconButton icon={<MdNotificationsNone />} label="Notifications" badge={unread} onClick={() => navigate("/a/notifications")} />} />}>
      <div className="brand-head">
        <h2>Hi {user?.first_name || "Admin"}</h2>
        <p>Revenue this month: {naira(s.revenue)}</p>
      </div>

      {(unused > 0 || serverErrors > 0) && (
        <Card variant="attention" to="/a/payments">
          <div className="row" style={{ gap: 12 }}>
            <MdWarningAmber style={{ fontSize: 28, flex: "none" }} />
            <div className="grow">
              <p className="card__title" style={{ margin: 0 }}>
                {unused > 0 ? `${unused} paid payment${unused > 1 ? "s" : ""} not used yet` : `${serverErrors} server errors in the last 5 minutes`}
              </p>
              <p className="card__text">{unused > 0 ? "A customer paid but nothing was created. Follow up or refund." : "Check Payments & alerts."}</p>
            </div>
            <MdChevronRight style={{ fontSize: 24 }} />
          </div>
        </Card>
      )}

      <Section title="Needs you">
        <List>
          <ListItem icon={<MdEventNote />} leadTone={unassigned.length ? "warn" : "muted"} title="Unassigned bookings" text="Calls waiting for a technician" trailing={<b>{unassigned.length}</b>} to="/a/bookings" />
          <ListItem icon={<MdLocalShipping />} leadTone={repairsToAct.length ? "warn" : "muted"} title="Repairs to move on" text="Quotes to send, repairs to start, devices to return" trailing={<b>{repairsToAct.length}</b>} to="/a/repairs" />
        </List>
      </Section>

      <Section title="Business">
        <div className="stats">
          <StatTile icon={<MdPeople />} value={s.totalUsers ?? "–"} label="Customers" to="/a/people/users" />
          <StatTile icon={<MdEngineering />} value={s.totalTechnicians ?? "–"} label="Technicians" to="/a/people/technicians" />
          <StatTile icon={<MdConfirmationNumber />} value={s.openTickets ?? "–"} label="Open tickets" to="/a/tickets" />
          <StatTile icon={<MdPayments />} value={naira(s.revenue)} label={s.revenueChangePercent == null ? "Revenue this month" : `${s.revenueChangePercent >= 0 ? "+" : ""}${Number(s.revenueChangePercent).toFixed(1)}% vs last month`} to="/a/payments" />
          <StatTile icon={<MdBuild />} value={s.repairsToday ?? "–"} label="Repairs delivered today" to="/a/repairs" />
          <StatTile icon={<MdWarningAmber />} value={s.pendingApprovals ?? "–"} label="Bookings and repairs open" to="/a/bookings" tone={s.pendingApprovals > 0 ? "warn" : undefined} />
        </div>
      </Section>

      <Section title="Tools">
        <List>
          <ListItem icon={<MdPriceChange />} title="Pricing" text="Call prices, pickup areas and rules" to="/a/pricing" />
          <ListItem icon={<MdSmartToy />} title="FixBot" text="Run a diagnosis for a customer" to="/a/fixbot" />
        </List>
      </Section>
    </Screen>
  );
}
