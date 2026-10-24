import { useState } from "react";
import { MdCall, MdOpenInNew, MdDesktopWindows, MdCheckCircle, MdEventBusy, MdBuild, MdReportProblem } from "react-icons/md";
import { Button, Card, Notice, Pill, SelectField, Sheet, TextField, useSnack } from "../../ui";
import { createMeetingLink, reportRepair, setAppointmentStatus, setTicketStatus, startRemoteSession } from "../../core/api/technician.api";
import { CALL_TYPES, whatsappNumber } from "../../core/utils/jobs";
import { openExternal } from "../../core/native";
import { CALL_LABELS, capitalize, formatDate, formatTime, telHref, ticketTone, bookingTone } from "../../lib/format";

const MESH_URL = import.meta.env.VITE_MESHCENTRAL_WEB_URL || "";

function useRun(onDone) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

/* Booked call: the right way to start each kind, then finish it. */
export function AppointmentSheet({ booking, onClose, onChanged }) {
  const snack = useSnack();
  const [meetingUrl, setMeetingUrl] = useState(booking?.meeting_url || null);
  const [remoteSent, setRemoteSent] = useState(false);
  const { busy, error, run } = useRun();
  if (!booking) return null;

  const live = booking.status === "confirmed";
  const wa = whatsappNumber(booking.customer_phone);

  const finish = (status) =>
    run(async () => {
      await setAppointmentStatus(booking.id, status);
      snack(status === "completed" ? "Marked completed" : "Marked missed");
      onChanged();
      onClose();
    });

  return (
    <Sheet open onClose={onClose} title={CALL_TYPES[booking.support_type]?.label || CALL_LABELS[booking.support_type] || "Appointment"} subtitle={`${booking.booking_reference} · ${formatDate(booking.booking_date, { weekday: true, year: false })}, ${formatTime(booking.booking_time)}`}>
      <Card variant="tonal">
        <p className="card__title">{booking.customer_name}</p>
        <p className="card__text">{booking.issue_summary || booking.device || "No details given"}</p>
        <div style={{ marginTop: 8 }}>
          <Pill tone={bookingTone(booking.status)}>{capitalize(booking.status)}</Pill>
        </div>
      </Card>

      {live && booking.support_type === "voice" &&
        (booking.customer_phone ? (
          <div className="btn-row">
            <Button size="lg" className="grow" icon={<MdCall />} onClick={() => openExternal(telHref(booking.customer_phone))}>
              Call {booking.customer_phone}
            </Button>
            {wa && (
              <Button size="lg" variant="tonal" onClick={() => openExternal(`https://wa.me/${wa}`)}>
                WhatsApp
              </Button>
            )}
          </div>
        ) : (
          <Notice tone="warn">No phone number on file. Ask the admin for the customer's contact.</Notice>
        ))}

      {live && booking.support_type === "video" && (
        <Button
          size="lg"
          icon={<MdOpenInNew />}
          loading={busy}
          onClick={() =>
            run(async () => {
              let url = meetingUrl;
              if (!url) {
                url = (await createMeetingLink(booking.id)).meeting_url;
                setMeetingUrl(url);
              }
              openExternal(url);
            })
          }>
          {meetingUrl ? "Join video call" : "Create and join video call"}
        </Button>
      )}

      {live && booking.support_type === "remote_desktop" &&
        (remoteSent ? (
          <>
            <Notice tone="ok">Invite sent. The customer has the link by email.</Notice>
            {MESH_URL && (
              <Button variant="tonal" icon={<MdOpenInNew />} onClick={() => openExternal(MESH_URL)}>
                Open MeshCentral
              </Button>
            )}
          </>
        ) : (
          <Button size="lg" icon={<MdDesktopWindows />} loading={busy} onClick={() => run(async () => { await startRemoteSession(booking.id); setRemoteSent(true); })}>
            Start remote session
          </Button>
        ))}

      {error && <Notice tone="error">{error}</Notice>}

      {live && (
        <div className="btn-row">
          <Button className="grow" variant="success" icon={<MdCheckCircle />} disabled={busy} onClick={() => finish("completed")}>
            Mark completed
          </Button>
          <Button variant="outlined" icon={<MdEventBusy />} disabled={busy} onClick={() => finish("missed")}>
            Missed
          </Button>
        </div>
      )}
    </Sheet>
  );
}

/* Mail-in repair: report the result; the admin takes it from there. */
export function RepairSheet({ repair, onClose, onChanged }) {
  const snack = useSnack();
  const [mode, setMode] = useState(null);
  const [note, setNote] = useState("");
  const { busy, error, run } = useRun();
  if (!repair) return null;

  const open = repair.status === "repair" && !repair.repair_outcome;

  const submit = (outcome) =>
    run(async () => {
      await reportRepair(repair.id, { outcome, note: note.trim() || undefined });
      snack(outcome === "repaired" ? "Marked repaired. The admin will take it from here." : "Sent to the admin");
      onChanged();
      onClose();
    });

  return (
    <Sheet open onClose={onClose} title={`${repair.brand || ""} ${repair.device || ""}`.trim()} subtitle={`${repair.reference} · ${repair.name}`}>
      <Card variant="tonal">
        <span className="t-label-sm muted">What to fix</span>
        <p style={{ margin: "4px 0 0", whiteSpace: "pre-line" }}>{repair.diagnosis_summary || repair.fault}</p>
        {repair.diagnosis_summary && repair.fault && (
          <p className="t-body-sm muted" style={{ margin: "8px 0 0" }}>
            Customer said: {repair.fault}
          </p>
        )}
      </Card>
      <Notice>The customer has approved and paid. No amount is needed from you.</Notice>

      {!open ? (
        <Notice tone="ok">{repair.repair_outcome === "repaired" ? "You marked this repaired" : repair.repair_outcome === "unrepairable" ? "You marked this can't be repaired" : "Finished"}. Waiting on the admin.</Notice>
      ) : mode === "unrepairable" ? (
        <>
          <TextField label="Why can't it be repaired?" multiline rows={4} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} supporting="e.g. Motherboard is cracked; part not available" />
          <Button size="lg" variant="danger" disabled={!note.trim()} loading={busy} onClick={() => submit("unrepairable")}>
            Send to admin
          </Button>
          <Button variant="text" onClick={() => setMode(null)}>
            Back
          </Button>
        </>
      ) : (
        <>
          <TextField label="Note for the admin (optional)" multiline rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          <Button size="lg" variant="success" icon={<MdBuild />} loading={busy} onClick={() => submit("repaired")}>
            Mark repaired
          </Button>
          <Button variant="outlined" icon={<MdReportProblem />} disabled={busy} onClick={() => setMode("unrepairable")}>
            Can't repair it
          </Button>
        </>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </Sheet>
  );
}

const TICKET_STATUSES = ["Open", "In Progress", "Pending", "Completed"];

/* Other support tickets: update the status. */
export function TicketSheet({ ticket, onClose, onChanged }) {
  const snack = useSnack();
  const { busy, error, run } = useRun();
  if (!ticket) return null;
  const wa = whatsappNumber(ticket.customer_phone);

  const update = (status) =>
    run(async () => {
      await setTicketStatus(ticket.id, status);
      snack(`Status: ${status}`);
      onChanged();
      if (status === "Completed") onClose();
    });

  return (
    <Sheet open onClose={onClose} title={ticket.device || "Support ticket"} subtitle={`${ticket.ticket_code} · ${ticket.customer_name}`}>
      <Card variant="tonal">
        <p style={{ margin: 0 }}>{ticket.issue}</p>
        <div className="row" style={{ marginTop: 8 }}>
          <Pill tone={ticketTone(ticket.status)}>{ticket.status}</Pill>
          {ticket.priority && <Pill tone="muted">{ticket.priority}</Pill>}
        </div>
      </Card>
      {ticket.customer_phone && (
        <div className="btn-row">
          <Button className="grow" variant="tonal" icon={<MdCall />} onClick={() => openExternal(telHref(ticket.customer_phone))}>
            Call customer
          </Button>
          {wa && (
            <Button variant="tonal" onClick={() => openExternal(`https://wa.me/${wa}`)}>
              WhatsApp
            </Button>
          )}
        </div>
      )}
      {ticket.status !== "Completed" && (
        <>
          <SelectField label="Status" value={ticket.status} onChange={(e) => update(e.target.value)} options={TICKET_STATUSES} disabled={busy} />
          <Button size="lg" variant="success" icon={<MdCheckCircle />} loading={busy} onClick={() => update("Completed")}>
            Mark complete
          </Button>
        </>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </Sheet>
  );
}

/** Opens the right sheet for a job from buildJobs(). */
export function JobSheet({ job, onClose, onChanged }) {
  if (!job) return null;
  if (job.kind === "appointment") return <AppointmentSheet booking={job.raw} onClose={onClose} onChanged={onChanged} />;
  if (job.kind === "repair") return <RepairSheet repair={job.raw} onClose={onClose} onChanged={onChanged} />;
  return <TicketSheet ticket={job.raw} onClose={onClose} onChanged={onChanged} />;
}
