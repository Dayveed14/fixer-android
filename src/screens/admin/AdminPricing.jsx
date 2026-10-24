import { useEffect, useMemo, useState } from "react";
import { MdSave, MdAdd, MdAutoFixHigh } from "react-icons/md";
import { AppBar, Button, Card, Checkbox, ErrorState, Fab, Loading, Notice, Screen, Section, Sheet, Tabs, TextField, useAsync, useSnack } from "../../ui";
import { getPricing, saveSettings, saveSupportTypes, saveZones } from "../../core/api/pricing.api";
import { naira } from "../../lib/format";

// Same formula as the web admin and the server's rate card.
export function feeFromRateCard(km, s) {
  const raw = Number(s.base_fee) + Number(s.per_km) * Number(km);
  const step = Number(s.round_to) || 1;
  return Math.max(Number(s.min_fee), Math.ceil(raw / step) * step);
}

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);

const SETTINGS = [
  ["base_fee", "Base fee (₦)"],
  ["per_km", "Per km from Wuse (₦)"],
  ["round_to", "Round up to (₦)"],
  ["min_fee", "Minimum fee (₦)"],
  ["delivery_confirm_hours", "Hours to confirm delivery"],
];

export default function AdminPricing() {
  const snack = useSnack();
  const { data, error, loading, reload } = useAsync(getPricing);
  const [tab, setTab] = useState("calls");
  const [types, setTypes] = useState([]);
  const [zones, setZones] = useState([]);
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newZone, setNewZone] = useState({ name: "", group: "", distanceKm: "" });

  useEffect(() => {
    if (data) {
      setTypes(data.support_types);
      setZones(data.zones);
      setSettings(data.settings);
    }
  }, [data]);

  const groups = useMemo(() => [...new Set(zones.map((z) => z.group))], [zones]);

  if (loading && !data) return <Screen appBar={<AppBar title="Pricing" back />}><Loading /></Screen>;
  if (error) return <Screen appBar={<AppBar title="Pricing" back />}><ErrorState message={error.message} onRetry={reload} /></Screen>;
  if (!settings) return null;

  const run = async (fn, okMessage) => {
    setBusy(true);
    setSaveError(null);
    try {
      await fn();
      snack(okMessage);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const updateZone = (id, patch) => setZones((list) => list.map((z) => (z.id === id ? { ...z, ...patch } : z)));

  const addZone = () => {
    const name = newZone.name.trim();
    const km = Number(newZone.distanceKm);
    if (!name || !(km >= 0)) return;
    let id = slugify(name) || `area_${Date.now()}`;
    while (zones.some((z) => z.id === id)) id = `${id}_2`;
    setZones((list) => [...list, { id, name, group: newZone.group.trim() || "Other", distanceKm: km, fee: feeFromRateCard(km, settings), active: true }]);
    setNewZone({ name: "", group: newZone.group, distanceKm: "" });
    setAdding(false);
  };

  return (
    <Screen
      appBar={<AppBar title="Pricing" subtitle="Changes apply to new bookings straight away" back />}
      fab={tab === "areas" && <Fab icon={<MdAdd />} label="Add area" onClick={() => setAdding(true)} />}>
      <Tabs
        value={tab}
        onChange={(t) => {
          setTab(t);
          setSaveError(null);
        }}
        tabs={[
          { value: "calls", label: "Calls" },
          { value: "areas", label: "Pickup areas" },
          { value: "rules", label: "Rules" },
        ]}
      />

      {tab === "calls" && (
        <>
          <p className="muted" style={{ margin: 0 }}>
            What customers pay to book each kind of session.
          </p>
          {types.map((t) => (
            <TextField key={t.id} label={`${t.title} (₦)`} type="number" inputMode="numeric" value={t.amount} onChange={(e) => setTypes((list) => list.map((x) => (x.id === t.id ? { ...x, amount: e.target.value } : x)))} />
          ))}
          {saveError && <Notice tone="error">{saveError}</Notice>}
          <Button size="lg" icon={<MdSave />} loading={busy} onClick={() => run(() => saveSupportTypes(types.map((t) => ({ id: t.id, amount: Number(t.amount) }))), "Call prices saved")}>
            Save call prices
          </Button>
        </>
      )}

      {tab === "areas" && (
        <>
          <Button variant="tonal" icon={<MdAutoFixHigh />} onClick={() => setZones((list) => list.map((z) => ({ ...z, fee: feeFromRateCard(z.distanceKm, settings) })))}>
            Reset every fee to the rate card
          </Button>
          {groups.map((g) => (
            <Section key={g} title={g}>
              {zones
                .filter((z) => z.group === g)
                .map((z) => (
                  <Card key={z.id} variant={z.active ? "tonal" : "outlined"}>
                    <div className="zone-row">
                      <div>
                        <p className="card__title" style={{ margin: 0, opacity: z.active ? 1 : 0.5 }}>
                          {z.name}
                        </p>
                        <span className="t-body-sm muted">
                          {z.distanceKm} km · rate card {naira(feeFromRateCard(z.distanceKm, settings))}
                        </span>
                      </div>
                      <TextField label="Fee (₦)" type="number" inputMode="numeric" value={z.fee} onChange={(e) => updateZone(z.id, { fee: e.target.value })} className="surface-low" />
                    </div>
                    <Checkbox checked={Boolean(z.active)} onChange={(e) => updateZone(z.id, { active: e.target.checked })} label="Offer pickups here" />
                  </Card>
                ))}
            </Section>
          ))}
          {saveError && <Notice tone="error">{saveError}</Notice>}
          <Button
            size="lg"
            icon={<MdSave />}
            loading={busy}
            onClick={() => run(() => saveZones(zones.map((z) => ({ id: z.id, name: z.name, group: z.group, distanceKm: Number(z.distanceKm), fee: Number(z.fee), active: Boolean(z.active) }))), "Pickup areas saved")}>
            Save pickup areas
          </Button>
        </>
      )}

      {tab === "rules" && (
        <>
          <Card variant="tonal">
            <p className="card__text">
              Suggested pickup fee = {naira(settings.base_fee)} + {naira(settings.per_km)} per km, rounded up to {naira(settings.round_to)}, at least {naira(settings.min_fee)}.
            </p>
          </Card>
          {SETTINGS.map(([k, label]) => (
            <TextField key={k} label={label} type="number" inputMode="numeric" value={settings[k]} onChange={(e) => setSettings((s) => ({ ...s, [k]: e.target.value }))} />
          ))}
          <Checkbox checked={Boolean(settings.charge_return_on_decline)} onChange={(e) => setSettings((s) => ({ ...s, charge_return_on_decline: e.target.checked }))} label="Customers who decline a quote pay the return delivery fee" />
          {saveError && <Notice tone="error">{saveError}</Notice>}
          <Button
            size="lg"
            icon={<MdSave />}
            loading={busy}
            onClick={() =>
              run(
                () =>
                  saveSettings({
                    base_fee: Number(settings.base_fee),
                    per_km: Number(settings.per_km),
                    round_to: Number(settings.round_to),
                    min_fee: Number(settings.min_fee),
                    delivery_confirm_hours: Number(settings.delivery_confirm_hours),
                    charge_return_on_decline: Boolean(settings.charge_return_on_decline),
                  }),
                "Rules saved",
              )
            }>
            Save rules
          </Button>
        </>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add a pickup area" subtitle="Save pickup areas afterwards to make it live.">
        <TextField label="Area name" value={newZone.name} onChange={(e) => setNewZone((n) => ({ ...n, name: e.target.value }))} maxLength={80} />
        <TextField label="Group" value={newZone.group} onChange={(e) => setNewZone((n) => ({ ...n, group: e.target.value }))} supporting={groups.length ? `e.g. ${groups.join(", ")}` : undefined} maxLength={40} />
        <TextField label="Distance from Wuse (km)" type="number" inputMode="decimal" value={newZone.distanceKm} onChange={(e) => setNewZone((n) => ({ ...n, distanceKm: e.target.value }))} supporting={newZone.distanceKm !== "" ? `Rate card fee ${naira(feeFromRateCard(Number(newZone.distanceKm), settings))}` : undefined} />
        <Button size="lg" icon={<MdAdd />} disabled={!newZone.name.trim() || newZone.distanceKm === ""} onClick={addZone}>
          Add area
        </Button>
      </Sheet>
    </Screen>
  );
}
