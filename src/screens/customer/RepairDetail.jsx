import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MdCheckCircle, MdPayments, MdTimer } from "react-icons/md";
import { AppBar, Button, Card, ErrorState, Loading, Notice, Pill, Screen, Section, Sheet, useAsync, useSnack } from "../../ui";
import { confirmDelivery, getShipment, respondToQuote } from "../../core/api/shipments.api";
import { initializePayment } from "../../core/api/payments.api";
import { payWithPaystack } from "../../core/paystack";
import { timeLeft } from "../../core/utils/shipmentStatus";
import { formatDate, formatDateTime, formatTime, naira } from "../../lib/format";
import { ShipmentTimeline, customerStatus } from "../shared/Timeline";

function QuoteCard({ shipment, onDone }) {
  const snack = useSnack();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [paid, setPaid] = useState(null); // { decision, reference } after Paystack

  const total = Number(shipment.quote_total);
  const declineFee = Number(shipment.decline_fee) || 0;

  const submit = async (decision, reference) => {
    setBusy(true);
    setError(null);
    try {
      await respondToQuote(shipment.id, { decision, payment_reference: reference });
      setDeclineOpen(false);
      snack(decision === "approve" ? "Approved. We'll start the repair." : "Declined. We'll send your device back.");
      onDone();
    } catch (err) {
      setError(reference ? `${err.message} Your payment reference is ${reference}; you can retry without paying again.` : err.message);
    } finally {
      setBusy(false);
    }
  };

  const payThen = async (decision) => {
    setBusy(true);
    setError(null);
    try {
      const intent = await initializePayment({ purpose: decision === "approve" ? "repair" : "return", shipment_id: shipment.id });
      const result = await payWithPaystack(intent, { shipment: shipment.reference, decision });
      if (!result) {
        setBusy(false);
        return;
      }
      setPaid({ decision, reference: result.reference });
      await submit(decision, result.reference);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Card variant="attention">
      <p className="card__title">Your repair quote</p>
      <p className="card__text" style={{ whiteSpace: "pre-line" }}>
        {shipment.diagnosis_summary}
      </p>
      <dl className="kv" style={{ marginTop: 16 }}>
        <dt>Repair</dt>
        <dd>{naira(shipment.repair_cost)}</dd>
        <dt>Return delivery</dt>
        <dd>{naira(shipment.return_fee)}</dd>
        <dt className="kv__total">Total</dt>
        <dd className="kv__total">{naira(total)}</dd>
      </dl>
      {error && (
        <div style={{ marginTop: 12 }}>
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <div className="btn-col" style={{ marginTop: 16 }}>
        {paid ? (
          <Button size="lg" loading={busy} onClick={() => submit(paid.decision, paid.reference)}>
            Retry confirmation
          </Button>
        ) : (
          <>
            <Button size="lg" icon={<MdPayments />} loading={busy} onClick={() => payThen("approve")}>
              Approve and pay {naira(total)}
            </Button>
            <Button variant="outlined" disabled={busy} onClick={() => setDeclineOpen(true)}>
              Decline
            </Button>
          </>
        )}
      </div>

      <Sheet open={declineOpen} onClose={() => !busy && setDeclineOpen(false)} title="Decline the repair?">
        <p className="muted" style={{ margin: 0 }}>
          We won't repair it and we'll send your device back.
          {declineFee > 0 ? ` You'll only pay return delivery: ${naira(declineFee)}.` : ""}
        </p>
        <Button size="lg" variant="danger" loading={busy} onClick={() => (declineFee > 0 ? payThen("decline") : submit("decline"))}>
          {declineFee > 0 ? `Pay ${naira(declineFee)} and decline` : "Decline repair"}
        </Button>
        <Button variant="text" disabled={busy} onClick={() => setDeclineOpen(false)}>
          Keep the quote
        </Button>
      </Sheet>
    </Card>
  );
}

function DeliveryCard({ shipment, onDone }) {
  const snack = useSnack();
  const [now, setNow] = useState(() => new Date());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const left = timeLeft(shipment.delivery_confirm_by, now);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await confirmDelivery(shipment.id);
      snack("Thanks! Delivery confirmed.");
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card variant="attention">
      <p className="card__title">Your device is on its way back</p>
      <p className="card__text">Tap below as soon as it's in your hands.</p>
      <p className="row t-body-sm" style={{ margin: "12px 0 0" }}>
        <MdTimer />
        {left ? `Confirmed automatically in ${left} if you don't.` : "It will be confirmed automatically shortly."}
      </p>
      {error && (
        <div style={{ marginTop: 12 }}>
          <Notice tone="error">{error}</Notice>
        </div>
      )}
      <Button size="lg" block variant="success" icon={<MdCheckCircle />} loading={busy} onClick={confirm} style={{ marginTop: 16 }}>
        I've received my device
      </Button>
    </Card>
  );
}

export default function RepairDetail() {
  const { id } = useParams();
  const { data: s, error, loading, reload } = useAsync(() => getShipment(id), [id]);

  if (loading && !s) return <Screen appBar={<AppBar title="Repair" back />}><Loading /></Screen>;
  if (error) return <Screen appBar={<AppBar title="Repair" back />}><ErrorState message={error.message} onRetry={reload} /></Screen>;

  const st = customerStatus(s);
  const pending = s.status === "waiting_approval" && s.approval_status === "pending";

  return (
    <Screen appBar={<AppBar title={`${s.brand || ""} ${s.device || ""}`.trim()} subtitle={s.reference} back />}>
      <div>
        <Pill tone={st.tone}>{st.text}</Pill>
      </div>

      {pending && <QuoteCard shipment={s} onDone={reload} />}
      {s.status === "ready_for_delivery" && <DeliveryCard shipment={s} onDone={reload} />}
      {s.status === "delivered" && s.delivered_at && (
        <Notice tone="ok">
          <p>
            Delivered {formatDateTime(s.delivered_at)}
            {s.delivery_confirmed_by === "auto" ? " (confirmed automatically)" : ""}.
          </p>
        </Notice>
      )}

      <Section title="Progress">
        <Card variant="tonal">
          <ShipmentTimeline shipment={s} />
        </Card>
      </Section>

      <Section title="Details">
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
            <dt>Pickup fee</dt>
            <dd>{naira(s.fee_amount)}</dd>
            {Number(s.approval_amount_paid) > 0 && (
              <>
                <dt>{s.approval_status === "approved" ? "Repair paid" : "Return paid"}</dt>
                <dd>{naira(s.approval_amount_paid)}</dd>
              </>
            )}
          </dl>
        </Card>
      </Section>
    </Screen>
  );
}
