import { useParams } from "react-router-dom";
import { MdOpenInNew, MdCall, MdMail, MdEventBusy, MdConfirmationNumber } from "react-icons/md";
import { AppBar, Button, Card, ErrorState, List, ListItem, Loading, Notice, Pill, Screen, Section, useAsync, useConfirm, useSnack } from "../../ui";
import api from "../../core/api/client";
import { CALL_LABELS, bookingTone, capitalize, formatDate, formatTime, naira, telHref } from "../../lib/format";
import { openExternal } from "../../core/native";

export default function AppointmentDetail() {
  const { id } = useParams();
  const confirm = useConfirm();
  const snack = useSnack();
  const { data: b, error, loading, reload, setData } = useAsync(() => api.get(`/api/bookings/${id}`).then((r) => r.data), [id]);

  if (loading && !b) return <Screen appBar={<AppBar title="Appointment" back />}><Loading /></Screen>;
  if (error) return <Screen appBar={<AppBar title="Appointment" back />}><ErrorState message={error.message} onRetry={reload} /></Screen>;

  const canCancel = b.status === "pending" || b.status === "confirmed";
  const active = canCancel;

  const cancel = async () => {
    if (!(await confirm({ title: "Cancel this appointment?", body: "For refunds, contact support with your booking reference.", confirm: "Cancel appointment", cancel: "Keep it", danger: true }))) return;
    try {
      await api.patch(`/api/bookings/${id}/status`, { status: "cancelled" });
      setData((x) => ({ ...x, status: "cancelled" }));
      snack("Appointment cancelled");
    } catch (err) {
      snack(err.message);
    }
  };

  return (
    <Screen appBar={<AppBar title={CALL_LABELS[b.support_type] || "Appointment"} subtitle={b.booking_reference} back />}>
      <div>
        <Pill tone={bookingTone(b.status)}>{capitalize(b.status)}</Pill>
      </div>

      <Card variant="primary">
        <span className="t-label-sm">When</span>
        <p className="t-title-lg" style={{ margin: "4px 0 0" }}>
          {formatDate(b.booking_date, { weekday: true })}
        </p>
        <p className="card__text">
          {formatTime(b.booking_time)} · about {b.duration || 30} minutes (Abuja time)
        </p>
      </Card>

      {active && b.support_type === "video" &&
        (b.meeting_url ? (
          <Button size="lg" icon={<MdOpenInNew />} onClick={() => openExternal(b.meeting_url)}>
            Join video call
          </Button>
        ) : (
          <Notice>
            <p>Your video link will appear here before the call.</p>
          </Notice>
        ))}
      {active && b.support_type === "voice" && (
        <Notice>
          <p>Your technician will phone you at this time. Keep your phone close.</p>
        </Notice>
      )}
      {active && b.support_type === "remote_desktop" && (
        <Notice>
          <p>At your session time you'll get an email invite to let the technician connect to your computer.</p>
        </Notice>
      )}

      <Section title="Technician">
        {b.technician_name ? (
          <List>
            <ListItem icon={<MdCall />} title={b.technician_name} text={b.technician_phone || "Phone not shared"} href={b.technician_phone ? telHref(b.technician_phone) : undefined} />
            {b.technician_email && <ListItem icon={<MdMail />} leadTone="muted" title={b.technician_email} href={`mailto:${b.technician_email}`} />}
          </List>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            A technician will be assigned before your appointment.
          </p>
        )}
      </Section>

      <Section title="Details">
        <Card variant="outlined">
          <dl className="kv">
            <dt>Device</dt>
            <dd>{b.device || "—"}</dd>
            <dt>Problem</dt>
            <dd>{b.issue_summary || "—"}</dd>
            <dt>Paid</dt>
            <dd>{naira(b.amount)}</dd>
            <dt>Payment</dt>
            <dd>{capitalize(b.payment_status)}</dd>
          </dl>
        </Card>
      </Section>

      {b.ticket_id && (
        <List>
          <ListItem icon={<MdConfirmationNumber />} title="Open the support job" text="Progress and rating" to={`/c/jobs/${b.ticket_id}`} />
        </List>
      )}

      {canCancel && (
        <Button variant="outlined" icon={<MdEventBusy />} onClick={cancel} style={{ color: "var(--error)", borderColor: "var(--error)" }}>
          Cancel appointment
        </Button>
      )}
    </Screen>
  );
}
