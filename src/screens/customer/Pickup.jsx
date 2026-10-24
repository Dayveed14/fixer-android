import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdCheck, MdPhoneAndroid, MdLaptop, MdTablet, MdDesktopWindows, MdDevicesOther } from "react-icons/md";
import { AppBar, Button, Card, Checkbox, ErrorState, Loading, Notice, PickerField, Screen, Section, TextField, useAsync } from "../../ui";
import { createShipment, getDispatchZones } from "../../core/api/shipments.api";
import { initializePayment } from "../../core/api/payments.api";
import { availableSlots, formatSlot, parseTime } from "../../core/utils/schedule";
import { payWithPaystack } from "../../core/paystack";
import { getStoredUser } from "../../core/session";
import { formatDate, fullName, naira } from "../../lib/format";
import DayTimePicker from "../shared/DayTimePicker";
import { Link } from "react-router-dom";

const DEVICES = [
  { value: "Smartphone", icon: <MdPhoneAndroid /> },
  { value: "Laptop", icon: <MdLaptop /> },
  { value: "Tablet", icon: <MdTablet /> },
  { value: "Desktop PC", icon: <MdDesktopWindows /> },
  { value: "Other", icon: <MdDevicesOther /> },
];

// "09:00" → "9:00 AM – 10:00 AM" (pickups are one-hour windows)
const windowLabel = (slot) => {
  const end = parseTime(slot) + 60;
  return `${formatSlot(slot)} – ${formatSlot(`${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`)}`;
};

const STEPS = ["Device", "Address", "Time", "Pay"];

export default function Pickup() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const { data: zoneData, error: zonesError, loading, reload } = useAsync(getDispatchZones);
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ device: "", brand: "", fault: "", zone: "", address: "", phone: user?.phone || "", notes: "", agree: false });
  const [when, setWhen] = useState({ date: null, time: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [paidRef, setPaidRef] = useState(null);
  const [done, setDone] = useState(null);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const zones = useMemo(() => zoneData?.zones || [], [zoneData]);
  const zone = zones.find((z) => z.id === f.zone);
  const zoneOptions = useMemo(() => zones.map((z) => ({ value: z.id, label: z.name, meta: naira(z.fee), group: z.group })), [zones]);

  const valid = [
    Boolean(f.device && f.brand.trim() && f.fault.trim()),
    Boolean(zone && f.address.trim() && f.phone.trim()),
    Boolean(when.date && when.time),
    f.agree,
  ];

  const submit = async (reference) => {
    setBusy(true);
    setError(null);
    try {
      const data = await createShipment({
        name: fullName(user),
        email: user.email,
        phone: f.phone.trim(),
        device: f.device,
        brand: f.brand.trim(),
        fault: f.fault.trim(),
        address: f.address.trim(),
        zone: f.zone,
        notes: f.notes.trim() || null,
        pickup_date: when.date,
        pickup_time: when.time,
        payment_reference: reference,
      });
      setDone(data);
    } catch (err) {
      setError(`${err.message} Your payment reference is ${reference}; tap Retry, or contact support with it.`);
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    if (!availableSlots(when.date, "pickup", new Date()).includes(when.time)) {
      setError("That pickup time just passed. Please pick another.");
      setWhen((w) => ({ ...w, time: null }));
      setStep(2);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const intent = await initializePayment({ purpose: "shipment", zone: f.zone, pickup_date: when.date, pickup_time: when.time });
      const paid = await payWithPaystack(intent, { device: `${f.brand} ${f.device}` });
      if (!paid) {
        setBusy(false);
        return;
      }
      setPaidRef(paid.reference);
      await submit(paid.reference);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Screen appBar={<AppBar title="Pickup booked" back="/c" />}>
        <div className="done-hero">
          <span className="done-hero__tick">
            <MdCheck />
          </span>
          <h2>Pickup scheduled</h2>
          <p className="muted">
            We'll collect your {f.brand} {f.device} on {formatDate(when.date, { weekday: true })}, {windowLabel(when.time)}.
          </p>
          <span className="mono">{done.reference}</span>
        </div>
        <Notice>
          <p>You'll get updates here as it moves along. When the diagnosis is done, you'll approve the quote before any repair.</p>
        </Notice>
        <div className="btn-col">
          <Button size="lg" onClick={() => navigate(`/c/repairs/${done.id}`, { replace: true })}>
            Track this repair
          </Button>
          <Button variant="text" onClick={() => navigate("/c", { replace: true })}>
            Back to home
          </Button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen appBar={<AppBar title="Send it in for repair" subtitle={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`} back />}>
      <div className="progress">
        <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      {step === 0 && (
        <Section title="What are we picking up?">
          <div className="chips">
            {DEVICES.map((d) => (
              <button key={d.value} type="button" className={`chip ${f.device === d.value ? "is-selected" : ""}`} aria-pressed={f.device === d.value} onClick={() => setF((x) => ({ ...x, device: d.value }))}>
                {d.icon}
                {d.value}
              </button>
            ))}
          </div>
          <TextField label="Brand and model" value={f.brand} onChange={set("brand")} supporting="e.g. Samsung A54, HP EliteBook 840" maxLength={120} />
          <TextField label="What's wrong with it?" multiline rows={4} value={f.fault} onChange={set("fault")} maxLength={500} />
        </Section>
      )}

      {step === 1 &&
        (loading ? (
          <Loading />
        ) : zonesError ? (
          <ErrorState message={zonesError.message} onRetry={reload} />
        ) : (
          <Section title="Where should we collect it?">
            <PickerField label="Area in Abuja" sheetTitle="Choose your area" searchable value={f.zone} onChange={(zoneId) => setF((x) => ({ ...x, zone: zoneId }))} placeholder="Choose your area" options={zoneOptions} supporting={zone ? `Pickup fee ${naira(zone.fee)}` : "The pickup fee depends on the area"} />
            <TextField label="Street address" multiline rows={2} value={f.address} onChange={set("address")} autoComplete="street-address" maxLength={300} />
            <TextField label="Phone for the rider" type="tel" inputMode="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" maxLength={30} />
            <TextField label="Notes for the rider (optional)" value={f.notes} onChange={set("notes")} supporting="Landmark, gate code…" maxLength={500} />
          </Section>
        ))}

      {step === 2 && (
        <Section title="When should we come?">
          <p className="muted" style={{ margin: 0 }}>
            One-hour pickup windows, Abuja time.
          </p>
          <DayTimePicker kind="pickup" date={when.date} time={when.time} onChange={setWhen} formatTimeLabel={(s) => formatSlot(s)} />
        </Section>
      )}

      {step === 3 && (
        <Section title="Review and pay the pickup fee">
          <Card variant="tonal">
            <dl className="kv">
              <dt>Device</dt>
              <dd>
                {f.brand} {f.device}
              </dd>
              <dt>Area</dt>
              <dd>{zone?.name}</dd>
              <dt>Pickup</dt>
              <dd>
                {formatDate(when.date, { weekday: true })}
                <br />
                {windowLabel(when.time)}
              </dd>
              <dt className="kv__total">Pickup fee</dt>
              <dd className="kv__total">{naira(zone?.fee)}</dd>
            </dl>
          </Card>
          <Notice>
            <p>This covers collection. After diagnosis you'll get a quote for the repair and return delivery. Nothing is repaired until you approve it.</p>
          </Notice>
          <Checkbox
            checked={f.agree}
            onChange={set("agree")}
            label={
              <>
                I agree to the <Link to="/info/shipment">shipment & repair policy</Link>.
              </>
            }
          />
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
          <Button className="grow-btn" disabled={!valid[step]} onClick={() => setStep(step + 1)}>
            Continue
          </Button>
        ) : paidRef ? (
          <Button className="grow-btn" loading={busy} onClick={() => submit(paidRef)}>
            Retry
          </Button>
        ) : (
          <Button className="grow-btn" loading={busy} disabled={!valid[3]} onClick={pay}>
            Pay {naira(zone?.fee)}
          </Button>
        )}
      </div>
    </Screen>
  );
}
