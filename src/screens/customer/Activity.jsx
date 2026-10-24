import { useState } from "react";
import { MdEvent, MdVideocam, MdCall, MdDesktopWindows, MdConfirmationNumber, MdHistory } from "react-icons/md";
import { AppBar, Button, EmptyState, ErrorState, List, ListItem, Pill, Screen, SkeletonList, Tabs, useAsync, useRefreshOnFocus } from "../../ui";
import api from "../../core/api/client";
import { getStoredUser } from "../../core/session";
import { CALL_LABELS, bookingTone, capitalize, formatDate, formatTime, ticketTone } from "../../lib/format";

const CALL_ICONS = { video: <MdVideocam />, voice: <MdCall />, remote_desktop: <MdDesktopWindows /> };

export default function Activity() {
  const user = getStoredUser();
  const [tab, setTab] = useState("appointments");
  const { data, error, loading, reload } = useAsync(async () => {
    const [b, t] = await Promise.all([
      api.get("/api/bookings", { params: { user_id: user.id } }).then((r) => r.data),
      api.get("/api/tickets", { params: { customer_id: user.id } }).then((r) => r.data),
    ]);
    return { bookings: b || [], tickets: t || [] };
  });
  useRefreshOnFocus(reload);

  const bookings = data?.bookings || [];
  const tickets = data?.tickets || [];

  return (
    <Screen appBar={<AppBar title="Activity" />}>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "appointments", label: "Appointments" },
          { value: "jobs", label: "Support jobs" },
        ]}
      />
      {loading && !data ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : tab === "appointments" ? (
        bookings.length === 0 ? (
          <EmptyState icon={<MdEvent />} title="No appointments" action={<Button to="/c/book">Book a technician</Button>}>
            Book a voice, video or remote session with a technician.
          </EmptyState>
        ) : (
          <List>
            {bookings.map((b) => (
              <ListItem
                key={b.id}
                icon={CALL_ICONS[b.support_type] || <MdEvent />}
                over={b.booking_reference}
                title={CALL_LABELS[b.support_type] || "Support call"}
                text={`${formatDate(b.booking_date, { weekday: true })} · ${formatTime(b.booking_time)}`}
                trailing={<Pill tone={bookingTone(b.status)}>{capitalize(b.status)}</Pill>}
                to={`/c/appointments/${b.id}`}
              />
            ))}
          </List>
        )
      ) : tickets.length === 0 ? (
        <EmptyState icon={<MdHistory />} title="No support jobs yet">
          Jobs from your calls and repairs appear here, with the technician's progress.
        </EmptyState>
      ) : (
        <List>
          {tickets.map((t) => (
            <ListItem
              key={t.id}
              icon={<MdConfirmationNumber />}
              over={`${t.ticket_code} · ${formatDate(t.created_at, { year: false })}`}
              title={t.issue}
              text={t.technician_name ? `with ${t.technician_name}` : "Waiting for a technician"}
              trailing={<Pill tone={ticketTone(t.status)}>{t.status}</Pill>}
              to={`/c/jobs/${t.id}`}
            />
          ))}
        </List>
      )}
    </Screen>
  );
}
