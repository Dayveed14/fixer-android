import { Link } from "react-router-dom";
import { MdNotificationsNone, MdHeadsetMic, MdLocalShipping, MdSmartToy, MdDevices, MdEvent, MdBuild, MdLaptop, MdAutoAwesome, MdChevronRight, MdVideocam } from "react-icons/md";
import { AppBar, Card, IconButton, List, ListItem, Screen, Section, StatTile, useAsync, useRefreshOnFocus } from "../../ui";
import { useNavigate } from "react-router-dom";
import api from "../../core/api/client";
import { listUserShipments } from "../../core/api/shipments.api";
import { getStoredUser } from "../../core/session";
import { useNotifications } from "../../core/notifications";
import { appLinkFor } from "../../core/routes";
import { CALL_LABELS, formatDate, formatTime, timeAgo } from "../../lib/format";
import { customerStatus, needsCustomer } from "../shared/Timeline";

export default function CustomerHome() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const { items: notifications, unread } = useNotifications();

  const { data, reload } = useAsync(async () => {
    const [stats, bookings, shipments] = await Promise.allSettled([
      api.get(`/api/stats/user/${user.id}`).then((r) => r.data),
      api.get("/api/bookings", { params: { user_id: user.id, upcoming: true, limit: 3 } }).then((r) => r.data),
      listUserShipments(user.email),
    ]);
    return {
      stats: stats.status === "fulfilled" ? stats.value : null,
      upcoming: bookings.status === "fulfilled" ? bookings.value : [],
      shipments: shipments.status === "fulfilled" && Array.isArray(shipments.value) ? shipments.value : [],
    };
  });
  useRefreshOnFocus(reload);

  const attention = (data?.shipments || []).filter(needsCustomer);
  const next = data?.upcoming?.[0];
  const s = data?.stats || {};

  return (
    <Screen
      appBar={
        <AppBar
          variant="brand"
          logo
          actions={<IconButton icon={<MdNotificationsNone />} label="Notifications" badge={unread} onClick={() => navigate("/c/notifications")} />}
        />
      }>
      <div className="brand-head">
        <h2>Hi {user?.first_name || "there"}</h2>
        <p>What can we fix for you today?</p>
      </div>

      {attention.map((sh) => {
        const st = customerStatus(sh);
        return (
          <Card key={sh.id} variant="attention" to={`/c/repairs/${sh.id}`}>
            <div className="row row--between">
              <div>
                <p className="card__title">{st.text}</p>
                <p className="card__text">
                  {sh.brand} {sh.device} · {sh.reference}
                </p>
              </div>
              <MdChevronRight style={{ fontSize: 24 }} />
            </div>
          </Card>
        );
      })}

      {next && (
        <Card variant="primary" to={`/c/appointments/${next.id}`}>
          <div className="row" style={{ gap: 16 }}>
            <span className="route-card__icon">{next.support_type === "video" ? <MdVideocam /> : <MdEvent />}</span>
            <div className="grow">
              <span className="t-label-sm">Next appointment</span>
              <p className="card__title" style={{ margin: 0 }}>
                {CALL_LABELS[next.support_type] || "Support call"}
              </p>
              <p className="card__text">
                {formatDate(next.booking_date, { weekday: true, year: false })} · {formatTime(next.booking_time)}
              </p>
            </div>
            <MdChevronRight style={{ fontSize: 24 }} />
          </div>
        </Card>
      )}

      <Section title="Get help">
        <div className="stats">
          <Link to="/c/book" className="stat">
            <span className="stat__icon"><MdHeadsetMic /></span>
            <span className="t-title">Talk to a technician</span>
            <span className="stat__label">Voice, video or remote</span>
          </Link>
          <Link to="/c/pickup" className="stat">
            <span className="stat__icon"><MdLocalShipping /></span>
            <span className="t-title">Send it in</span>
            <span className="stat__label">We collect and repair it</span>
          </Link>
          <Link to="/c/fixbot" className="stat">
            <span className="stat__icon"><MdSmartToy /></span>
            <span className="t-title">Ask FixBot</span>
            <span className="stat__label">Free diagnosis</span>
          </Link>
          <Link to="/c/devices" className="stat">
            <span className="stat__icon"><MdDevices /></span>
            <span className="t-title">My devices</span>
            <span className="stat__label">Register and view</span>
          </Link>
        </div>
      </Section>

      <Section title="At a glance">
        <div className="stats">
          <StatTile icon={<MdEvent />} value={s.appointmentsCount ?? "–"} label="Appointments" to="/c/activity" />
          <StatTile icon={<MdBuild />} value={s.repairsInProgress ?? "–"} label="Repairs in progress" to="/c/repairs" />
          <StatTile icon={<MdLaptop />} value={s.registeredDevices ?? "–"} label="Registered devices" to="/c/devices" />
          <StatTile icon={<MdAutoAwesome />} value={s.aiDiagnoses ?? "–"} label="FixBot diagnoses" to="/c/fixbot" />
        </div>
      </Section>

      {notifications.length > 0 && (
        <Section title="Recent activity" action={<Link to="/c/notifications" className="btn btn--text">See all</Link>}>
          <List>
            {notifications.slice(0, 3).map((n) => (
              <ListItem key={n.id} icon={<MdNotificationsNone />} leadTone={n.is_read ? "muted" : undefined} over={timeAgo(n.created_at)} title={n.title} text={n.message} to={appLinkFor(n, "user") || "/c/notifications"} />
            ))}
          </List>
        </Section>
      )}
    </Screen>
  );
}
