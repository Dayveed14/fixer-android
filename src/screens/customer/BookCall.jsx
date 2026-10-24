import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdCall, MdVideocam, MdDesktopWindows, MdCheck, MdOpenInNew } from "react-icons/md";
import { AppBar, Button, Card, EmptyState, ErrorState, Loading, Notice, Screen, Section, TextField, useAsync } from "../../ui";
import { createBooking, getSupportTypes } from "../../core/api/bookings.api";
import { initializePayment } from "../../core/api/payments.api";
import { availableSlots, formatSlot } from "../../core/utils/schedule";
import { payWithPaystack } from "../../core/paystack";
import { naira, formatDate } from "../../lib/format";
import { openExternal } from "../../core/native";
import DayTimePicker from "../shared/DayTimePicker";

const TYPE_INFO = {
  voice: { icon: <MdCall />, text: "A technician phones you at the time you pick" },
  video: { icon: <MdVideocam />, text: "Meet a technician on a video call; you get the link now" },
  remote: { icon: <MdDesktopWindows />, text: "A technician works on your computer remotely" },
  remote_desktop: { icon: <MdDesktopWindows />, text: "A technician works on your computer remotely" },
};

const STEPS = ["Type", "Time", "Details", "Pay"];

export default function BookCall() {
  const navigate = useNavigate();
  const { data: types, error: typesError, loading, reload } = useAsync(getSupportTypes);
  const [step, setStep] = useState(0);
  const [type, setType] = useState(null);
  const [when, setWhen] = useState({ date: null, time: null });
  const [device, setDevice] = useState("");
  const [issue, setIssue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [paidRef, setPaidRef] = useState(null);
  const [done, setDone] = useState(null);

  const selected = types?.find((t) => t.id === type);

  const confirm = async (reference) => {
    setBusy(true);
    setError(null);
    try {
      const result = await createBooking({
        support_type: type,
        booking_date: when.date,
        booking_time: when.time,
        issue_summary: issue.trim() || null,
        device: device.trim() || null,
        payment_reference: reference,
      });
      setDone(result);
    } catch (err) {
      // Safe to retry: the same payment can only create one booking.
      setError(`${err.message} Your payment reference is ${reference}; tap Retry, or contact support with it.`);
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    if (!availableSlots(when.date, "booking", new Date()).includes(when.time)) {
      setError("That time just passed. Please pick another.");
      setWhen((w) => ({ ...w, time: null }));
      setStep(1);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const intent = await initializePayment({ purpose: "booking", support_type: type, booking_date: when.date, booking_time: when.time });
      const paid = await payWithPaystack(intent, { support_type: type });
      if (!paid) {
        setBusy(false);
        return;
      }
      setPaidRef(paid.reference);
      await confirm(paid.reference);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Screen appBar={<AppBar title="Booked" back="/c" />}>
        <div className="done-hero">
          <span className="done-hero__tick">
            <MdCheck />
          </span>
          <h2>You're booked</h2>
          <p className="muted">
            {selected?.title} on {formatDate(when.date, { weekday: true })} at {formatSlot(when.time)}
          </p>
          <span className="mono">{done.booking_reference}</span>
        </div>
        {done.meeting_url && (
          <Notice>
            <p>Your video call link is ready. Open it at your booking time.</p>
          </Notice>
        )}
        <div className="btn-col">
          {done.meeting_url && (
            <Button size="lg" icon={<MdOpenInNew />} onClick={() => openExternal(done.meeting_url)}>
              Open video call link
            </Button>
          )}
          <Button size="lg" variant="tonal" onClick={() => navigate(`/c/appointments/${done.id}`, { replace: true })}>
            View booking
          </Button>
          <Button variant="text" onClick={() => navigate("/c", { replace: true })}>
            Back to home
          </Button>
        </div>
      </Screen>
    );
  }

  const canNext = [Boolean(type), Boolean(when.date && when.time), true, true][step];

  return (
    <Screen appBar={<AppBar title="Talk to a technician" subtitle={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`} back />}>
      <div className="progress">
        <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      {step === 0 &&
        (loading ? (
          <Loading />
        ) : typesError ? (
          <ErrorState message={typesError.message} onRetry={reload} />
        ) : !types?.length ? (
          <EmptyState title="Bookings are paused">Please try again later.</EmptyState>
        ) : (
          <Section title="How would you like help?">
            {types.map((t) => (
              <button key={t.id} type="button" className={`option-card ${type === t.id ? "is-selected" : ""}`} onClick={() => setType(t.id)} aria-pressed={type === t.id}>
                <span className="option-card__icon">{TYPE_INFO[t.id]?.icon || <MdCall />}</span>
                <span className="option-card__body">
                  <strong>{t.title}</strong>
                  <span>{TYPE_INFO[t.id]?.text}</span>
                </span>
                <span className="option-card__price">{naira(t.amount)}</span>
              </button>
            ))}
          </Section>
        ))}

      {step === 1 && (
        <Section title="When suits you?">
          <p className="muted" style={{ margin: 0 }}>
            Times are in Abuja time. Calls last about 30 minutes.
          </p>
          <DayTimePicker kind="booking" date={when.date} time={when.time} onChange={setWhen} />
        </Section>
      )}

      {step === 2 && (
        <Section title="Tell the technician what's wrong">
          <TextField label="Device (optional)" value={device} onChange={(e) => setDevice(e.target.value)} supporting="e.g. HP EliteBook 840" maxLength={120} />
          <TextField label="What's the problem? (optional)" multiline rows={5} value={issue} onChange={(e) => setIssue(e.target.value)} maxLength={1000} />
        </Section>
      )}

      {step === 3 && (
        <Section title="Review and pay">
          <Card variant="tonal">
            <dl className="kv">
              <dt>Service</dt>
              <dd>{selected?.title}</dd>
              <dt>Day</dt>
              <dd>{formatDate(when.date, { weekday: true })}</dd>
              <dt>Time</dt>
              <dd>{formatSlot(when.time)}</dd>
              {device && (
                <>
                  <dt>Device</dt>
                  <dd>{device}</dd>
                </>
              )}
              <dt className="kv__total">Total</dt>
              <dd className="kv__total">{naira(selected?.amount)}</dd>
            </dl>
          </Card>
          <p className="t-body-sm muted" style={{ margin: 0 }}>
            You'll pay securely with Paystack. Your booking is confirmed as soon as the payment goes through.
          </p>
        </Section>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      <div className="wizard-foot">
        {step > 0 && (
          <Button variant="outlined" onClick={() => setStep(step - 1)} disabled={busy}>
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button className="grow-btn" disabled={!canNext} onClick={() => setStep(step + 1)}>
            Continue
          </Button>
        ) : paidRef ? (
          <Button className="grow-btn" loading={busy} onClick={() => confirm(paidRef)}>
            Retry
          </Button>
        ) : (
          <Button className="grow-btn" loading={busy} onClick={pay}>
            Pay {naira(selected?.amount)}
          </Button>
        )}
      </div>
    </Screen>
  );
}
