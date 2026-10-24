import { useNavigate } from "react-router-dom";
import { MdNotificationsNone, MdDoneAll, MdLocalShipping, MdEvent, MdConfirmationNumber, MdNotifications } from "react-icons/md";
import { AppBar, Button, EmptyState, ErrorState, List, ListItem, Screen, SkeletonList, useSnack } from "../../ui";
import { markAllRead, markRead, useNotifications } from "../../core/notifications";
import { appLinkFor } from "../../core/routes";
import { getStoredUser } from "../../core/session";
import { timeAgo } from "../../lib/format";

const ICONS = { shipment: <MdLocalShipping />, booking: <MdEvent />, ticket: <MdConfirmationNumber /> };

export default function Notifications() {
  const navigate = useNavigate();
  const snack = useSnack();
  const role = getStoredUser()?.role;
  const { items, unread, loading, error, reload } = useNotifications({ poll: 30000 });

  const open = async (n) => {
    if (!n.is_read) markRead(n.id).catch(() => {});
    const to = appLinkFor(n, role);
    if (to) navigate(to);
  };

  const readAll = async () => {
    try {
      await markAllRead();
      snack("All caught up");
    } catch (err) {
      snack(err.message);
    }
  };

  return (
    <Screen
      appBar={
        <AppBar
          title="Notifications"
          back
          actions={unread > 0 && <Button variant="text" icon={<MdDoneAll />} onClick={readAll}>Mark all read</Button>}
        />
      }>
      {loading && items.length === 0 ? (
        <SkeletonList />
      ) : error && items.length === 0 ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState icon={<MdNotificationsNone />} title="No notifications">
          Updates about your bookings and repairs will show up here.
        </EmptyState>
      ) : (
        <List>
          {items.map((n) => (
            <ListItem
              key={n.id}
              icon={ICONS[n.reference_type] || <MdNotifications />}
              leadTone={n.is_read ? "muted" : undefined}
              over={timeAgo(n.created_at)}
              title={<span style={{ fontWeight: n.is_read ? 400 : 500 }}>{n.title}</span>}
              text={n.message}
              onClick={() => open(n)}
              chevron={Boolean(appLinkFor(n, role))}
            />
          ))}
        </List>
      )}
    </Screen>
  );
}
