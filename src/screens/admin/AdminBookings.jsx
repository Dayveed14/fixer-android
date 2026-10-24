import { useState } from "react";
import { MdCall, MdVideocam, MdDesktopWindows, MdEventAvailable, MdPersonAdd } from "react-icons/md";
import { AppBar, Button, Card, EmptyState, ErrorState, List, ListItem, Notice, Pill, Screen, Sheet, SkeletonList, Tabs, useAsync, useRefreshOnFocus, useSnack, PickerField } from "../../ui";
import api from "../../core/api/client";
import { CALL_LABELS, bookingTone, capitalize, formatDate, formatTime, naira, telHref } from "../../lib/format";
import { openExternal } from "../../core/native";

const ICONS = { voice: <MdCall />, video: <MdVideocam />, remote_desktop: <MdDesktopWindows /> };
const isOpen = (b) => !["cancelled", "completed", "missed"].includes(String(b.status).toLowerCase());

function BookingSheet({ booking, technicians, onClose, onChanged }) {
  const snack = useSnack();
  const [techId, setTechId] = useState(booking.technician_id ? String(booking.technician_id) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const assign = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/api/bookings/${booking.id}/assign`, { technician_id: Number(techId) });
      snack("Technician assigned");
      onChanged();
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title={CALL_LABELS[booking.support_type] || "Booking"} subtitle={`${booking.booking_reference} · ${formatDate(booking.booking_date, { weekday: true, year: false })}, ${formatTime(booking.booking_time)}`}>
      <Card variant="tonal">
        <p className="card__title">{booking.customer_name}</p>
        <p className="card__text">{booking.issue_summary || booking.device || "No details given"}</p>
        <div className="row" style={{ marginTop: 8, flexWrap: "wrap" }}>
          <Pill tone={bookingTone(booking.status)}>{capitalize(booking.status)}</Pill>
          <Pill tone={booking.payment_status === "paid" ? "ok" : "warn"}>{naira(booking.amount)} {booking.payment_status}</Pill>
        </div>
      </Card>
      {booking.customer_phone && (
        <Button variant="tonal" icon={<MdCall />} onClick={() => openExternal(telHref(booking.customer_phone))}>
          Call {booking.customer_phone}
        </Button>
      )}
      {isOpen(booking) && (
        <>
          <PickerField label="Technician" sheetTitle="Choose a technician" value={techId} onChange={(v) => setTechId(String(v))} placeholder="Choose a technician" options={technicians.map((t) => ({ value: String(t.id), label: `${t.first_name} ${t.last_name}` }))} />
          {technicians.length === 0 && <Notice tone="warn">No technicians yet. Add one under More → Technicians.</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
          <Button size="lg" icon={<MdPersonAdd />} disabled={!techId || String(booking.technician_id) === techId} loading={busy} onClick={assign}>
            {booking.technician_id ? "Reassign" : "Assign technician"}
          </Button>
        </>
      )}
    </Sheet>
  );
}

export default function AdminBookings() {
  const [tab, setTab] = useState("unassigned");
  const [open, setOpen] = useState(null);
  const { data, error, loading, reload } = useAsync(async () => {
    const [bookings, technicians] = await Promise.all([api.get("/api/bookings").then((r) => r.data), api.get("/api/users/technicians").then((r) => r.data)]);
    return { bookings, technicians };
  });
  useRefreshOnFocus(reload);

  const all = data?.bookings || [];
  const lists = {
    unassigned: all.filter((b) => isOpen(b) && !b.technician_id),
    upcoming: all.filter((b) => isOpen(b) && b.technician_id),
    all,
  };
  const list = lists[tab];

  return (
    <Screen appBar={<AppBar title="Bookings" subtitle="Calls and remote sessions" />}>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "unassigned", label: "Unassigned", count: lists.unassigned.length },
          { value: "upcoming", label: "Assigned" },
          { value: "all", label: "All" },
        ]}
      />
      {loading && !data ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState icon={<MdEventAvailable />} title={tab === "unassigned" ? "Everything is assigned" : "No bookings"} />
      ) : (
        <List>
          {list.map((b) => (
            <ListItem
              key={b.id}
              icon={ICONS[b.support_type]}
              leadTone={isOpen(b) && !b.technician_id ? "warn" : undefined}
              over={`${formatDate(b.booking_date, { weekday: true, year: false })} · ${formatTime(b.booking_time)}`}
              title={b.customer_name}
              text={b.technician_name ? `${CALL_LABELS[b.support_type]} · ${b.technician_name}` : `${CALL_LABELS[b.support_type]} · Unassigned`}
              trailing={<Pill tone={bookingTone(b.status)}>{capitalize(b.status)}</Pill>}
              onClick={() => setOpen(b)}
            />
          ))}
        </List>
      )}
      {open && <BookingSheet key={open.id} booking={open} technicians={data?.technicians || []} onClose={() => setOpen(null)} onChanged={reload} />}
    </Screen>
  );
}
