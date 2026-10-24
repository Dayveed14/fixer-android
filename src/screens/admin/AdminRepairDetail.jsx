import { useState } from "react";
import { useParams } from "react-router-dom";
import { MdCall, MdSend, MdArrowForward, MdCancel, MdPersonAdd } from "react-icons/md";
import { AppBar, Button, Card, ErrorState, List, ListItem, Loading, Notice, Pill, Screen, Section, Sheet, TextField, useAsync, useConfirm, useSnack, PickerField } from "../../ui";
import api from "../../core/api/client";
import { getShipment, sendQuote, updateShipmentStatus } from "../../core/api/shipments.api";
import { statusLabel } from "../../core/utils/shipmentStatus";
import { formatDate, formatTime, naira, telHref } from "../../lib/format";
import { ShipmentTimeline } from "../shared/Timeline";

const ACTION_LABELS = {
  courier_assigned: "Courier assigned",
  device_collected: "Device collected",
  diagnosis: "Start diagnosis",
  repair: "Assign technician & start repair",
  quality_check: "Move to quality check",
  ready_for_delivery: "Ready for delivery",
  delivered: "Mark delivered",
  cancelled: "Cancel pickup",
};

function QuoteSheet({ shipment, onClose, onDone }) {
  const [diagnosis, setDiagnosis] = useState(shipment.diagnosis_summary || "");
  const [cost, setCost] = useState(shipment.repair_cost ? String(Math.round(shipment.repair_cost)) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const repairCost = Number(cost);
  const valid = diagnosis.trim() && Number.isInteger(repairCost) && repairCost > 0;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendQuote(shipment.id, { diagnosis: diagnosis.trim(), repair_cost: repairCost });
      onDone("Quote sent to the customer");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={() => !busy && onClose()} title="Diagnosis and quote" subtitle={`${shipment.reference} · ${shipment.brand} ${shipment.device}`}>
      <TextField label="What did you find?" multiline rows={5} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} maxLength={2000} supporting="The customer sees this exactly as written" />
      <TextField label="Repair cost (₦)" type="number" inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value.replace(/\D/g, ""))} supporting="Return delivery is added automatically from the pickup area" />
      {error && <Notice tone="error">{error}</Notice>}
      <Button size="lg" icon={<MdSend />} disabled={!valid} loading={busy} onClick={submit}>
        Send quote {valid ? naira(repairCost) : ""}
      </Button>
    </Sheet>
  );
}

function AssignSheet({ shipment, onClose, onDone }) {
  const { data: technicians } = useAsync(() => api.get("/api/users/technicians").then((r) => r.data));
  const [techId, setTechId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await updateShipmentStatus(shipment.id, "repair", { technician_id: Number(techId) });
      onDone("Repair started");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={() => !busy && onClose()} title="Start the repair" subtitle="Choose who repairs it. They'll be notified.">
      <PickerField label="Technician" sheetTitle="Choose a technician" value={techId} onChange={(v) => setTechId(String(v))} placeholder="Choose a technician" options={(technicians || []).map((t) => ({ value: String(t.id), label: `${t.first_name} ${t.last_name}` }))} />
      {technicians?.length === 0 && <Notice tone="warn">No technicians yet. Add one under More → Technicians.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      <Button size="lg" icon={<MdPersonAdd />} disabled={!techId} loading={busy} onClick={submit}>
        Start repair
      </Button>
    </Sheet>
  );
}

export default function AdminRepairDetail() {
  const { id } = useParams();
  const snack = useSnack();
  const confirm = useConfirm();
  const { data: s, error, loading, reload } = useAsync(() => getShipment(id), [id]);
  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState(null);

  if (loading && !s) return <Screen appBar={<AppBar title="Repair" back />}><Loading /></Screen>;
  if (error) return <Screen appBar={<AppBar title="Repair" back />}><ErrorState message={error.message} onRetry={reload} /></Screen>;

  const a = s.next_actions || { statuses: [] };
  const done = (msg) => {
    setSheet(null);
    snack(msg);
    reload();
  };

  const move = async (status) => {
    if (status === "repair") return setSheet("assign");
    if (status === "cancelled" && !(await confirm({ title: `Cancel ${s.reference}?`, body: "The customer will be told the pickup is cancelled.", confirm: "Cancel pickup", danger: true }))) return undefined;
    setBusy(status);
    setActionError(null);
    try {
      await updateShipmentStatus(s.id, status);
      done(statusLabel(status));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(null);
    }
    return undefined;
  };

  return (
    <Screen appBar={<AppBar title={`${s.brand || ""} ${s.device || ""}`.trim()} subtitle={`${s.reference} · ${s.name}`} back />}>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <Pill tone="primary">{statusLabel(s.status)}</Pill>
        {s.approval_status && <Pill tone={s.approval_status === "approved" ? "ok" : s.approval_status === "declined" ? "muted" : "warn"}>Quote {s.approval_status}</Pill>}
        {s.repair_outcome && <Pill tone={s.repair_outcome === "repaired" ? "ok" : "error"}>{s.repair_outcome === "repaired" ? "Repaired" : "Can't repair"}</Pill>}
      </div>

      <Section title="Next step">
        {a.awaiting_customer && <Notice>Waiting for the customer to approve or decline the quote.</Notice>}
        {a.awaiting_technician && <Notice>Waiting for the technician to report back.</Notice>}
        {s.repair_note && <Notice tone={s.repair_outcome === "unrepairable" ? "warn" : "ok"}>Technician: {s.repair_note}</Notice>}
        <div className="btn-col">
          {a.can_quote && (
            <Button size="lg" icon={<MdSend />} onClick={() => setSheet("quote")}>
              {s.status === "diagnosis" ? "Send diagnosis and quote" : "Update the quote"}
            </Button>
          )}
          {a.statuses
            .filter((x) => x !== "cancelled")
            .map((status) => (
              <Button key={status} size="lg" variant={a.can_quote ? "tonal" : "filled"} icon={<MdArrowForward />} loading={busy === status} disabled={Boolean(busy)} onClick={() => move(status)}>
                {ACTION_LABELS[status] || statusLabel(status)}
              </Button>
            ))}
          {a.statuses.includes("cancelled") && (
            <Button variant="text" icon={<MdCancel />} disabled={Boolean(busy)} onClick={() => move("cancelled")} style={{ color: "var(--error)" }}>
              Cancel pickup
            </Button>
          )}
          {!a.can_quote && a.statuses.length === 0 && !a.awaiting_customer && !a.awaiting_technician && <p className="muted" style={{ margin: 0 }}>Nothing to do: this repair is closed.</p>}
        </div>
        {actionError && <Notice tone="error">{actionError}</Notice>}
      </Section>

      {s.quote_total && (
        <Card variant="tonal">
          <p className="card__title">Quote</p>
          <p className="card__text" style={{ whiteSpace: "pre-line" }}>
            {s.diagnosis_summary}
          </p>
          <dl className="kv" style={{ marginTop: 12 }}>
            <dt>Repair</dt>
            <dd>{naira(s.repair_cost)}</dd>
            <dt>Return delivery</dt>
            <dd>{naira(s.return_fee)}</dd>
            <dt className="kv__total">Total</dt>
            <dd className="kv__total">{naira(s.quote_total)}</dd>
          </dl>
        </Card>
      )}

      <Section title="Customer">
        <List>
          <ListItem icon={<MdCall />} title={s.name} text={s.phone ? `${s.phone} · tap to call` : "No phone"} href={s.phone ? telHref(s.phone) : undefined} />
        </List>
        <Card variant="outlined">
          <dl className="kv">
            <dt>Fault</dt>
            <dd>{s.fault}</dd>
            <dt>Pickup</dt>
            <dd>
              {formatDate(s.pickup_date)} · {formatTime(s.pickup_time)}
            </dd>
            <dt>Address</dt>
            <dd>
              {s.address}
              {s.city ? `, ${s.city}` : ""}
            </dd>
            {s.notes && (
              <>
                <dt>Notes</dt>
                <dd>{s.notes}</dd>
              </>
            )}
            <dt>Pickup fee</dt>
            <dd>{naira(s.fee_amount)}</dd>
            {Number(s.approval_amount_paid) > 0 && (
              <>
                <dt>Paid on quote</dt>
                <dd>{naira(s.approval_amount_paid)}</dd>
              </>
            )}
          </dl>
        </Card>

      </Section>

      <Section title="History">
        <Card variant="tonal">
          <ShipmentTimeline shipment={s} />
        </Card>
      </Section>

      {sheet === "quote" && <QuoteSheet shipment={s} onClose={() => setSheet(null)} onDone={done} />}
      {sheet === "assign" && <AssignSheet shipment={s} onClose={() => setSheet(null)} onDone={done} />}
    </Screen>
  );
}
