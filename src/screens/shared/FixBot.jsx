import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MdRefresh, MdSchedule, MdPayments, MdHeadsetMic, MdLocalShipping } from "react-icons/md";
import { AppBar, Button, Card, Chip, Notice, Pill, Screen, Section, Segmented, TextField } from "../../ui";
import FixBotMascot from "../../ui/fixbot/FixBotMascot";
import { runDiagnosis } from "../../core/api/diagnosis.api";
import { diagnosisKind, formatEstimatedRepair, noMatchMessage } from "../../core/utils/diagnosis";
import { getStoredUser } from "../../core/session";

// Same choices as the web's FixBot.
const DEVICE_TYPES = ["Laptop", "Desktop PC", "Other"];
const SYMPTOMS = ["Make noise", "Overheating", "Battery drains fast", "Burning smell", "Touchscreen unresponsive", "Lagging", "Keyboard not working", "Random restart", "Won't charge", "Other"];

const list = (val) => {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const SEVERITY_TONE = { low: "ok", medium: "warn", high: "error" };

function Severity({ value }) {
  if (!value) return null;
  const v = String(value).toLowerCase();
  return <Pill tone={SEVERITY_TONE[v] || "warn"}>{v.charAt(0).toUpperCase() + v.slice(1)} severity</Pill>;
}

function Causes({ causes, steps }) {
  return (
    <>
      {causes.length > 0 && (
        <div className="stack">
          <span className="t-title-sm">Likely causes</span>
          <ul className="result-list">
            {causes.map((c, i) => (
              <li key={i}>{typeof c === "string" ? c : c?.cause || c?.title || JSON.stringify(c)}</li>
            ))}
          </ul>
        </div>
      )}
      {steps.length > 0 && (
        <div className="stack">
          <span className="t-title-sm">Try this first</span>
          <ol className="result-list result-list--steps">
            {steps.map((s, i) => (
              <li key={i}>{typeof s === "string" ? s : s?.step || s?.title || JSON.stringify(s)}</li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}

export default function FixBot({ standalone }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [deviceType, setDeviceType] = useState(params.get("device") || "Laptop");
  const [brand, setBrand] = useState("");
  const [primaryFault, setPrimaryFault] = useState("");
  const [symptoms, setSymptoms] = useState(() => (params.get("symptom") ? [params.get("symptom")] : []));
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const user = getStoredUser();
  const isCustomer = user?.role === "user";
  const isStaff = user && !isCustomer;

  const go = (path) => (isCustomer ? navigate(path) : navigate("/login", { state: { from: path } }));

  const toggle = (s) => setSymptoms((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]));

  const run = async () => {
    if (!primaryFault.trim() && !description.trim() && symptoms.length === 0) {
      setError("Tell FixBot what's wrong: pick a symptom, or describe the problem.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setResult(
        await runDiagnosis({
          deviceType,
          brand,
          primaryFault: primaryFault.trim() || symptoms[0] || "",
          selectedSymptoms: symptoms,
          description,
        }),
      );
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const kind = result ? diagnosisKind(result) : null;
  const mood = busy ? "thinking" : kind === "no_match" ? "puzzled" : kind ? "happy" : error ? "oops" : "idle";

  const ctas = !isStaff && (
    <div className="btn-col">
      <Button size="lg" icon={<MdHeadsetMic />} onClick={() => go("/c/book")}>
        Talk to a technician
      </Button>
      <Button size="lg" variant="tonal" icon={<MdLocalShipping />} onClick={() => go("/c/pickup")}>
        Send it in for repair
      </Button>
    </div>
  );

  return (
    <Screen
      appBar={
        <AppBar
          title="FixBot"
          subtitle="Free device diagnosis"
          back={standalone}
          actions={result && <Button variant="text" icon={<MdRefresh />} onClick={() => setResult(null)}>New</Button>}
        />
      }>
      <div className="bot-stage">
        <FixBotMascot mood={mood} size={84} />
        <p>
          <strong>{busy ? "Checking the usual suspects…" : result ? "Here's what I found" : "What's wrong with your device?"}</strong>
          {!result && !busy && "Pick what you're seeing and I'll suggest causes and fixes."}
        </p>
      </div>

      {!result && (
        <>
          <Section title="Device">
            <Segmented label="Device type" value={deviceType} onChange={setDeviceType} options={DEVICE_TYPES.map((d) => ({ value: d, label: d }))} />
            <TextField label="Brand / model (optional)" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder=" " />
          </Section>

          <Section title="What's happening?">
            <div className="chips">
              {SYMPTOMS.map((s) => (
                <Chip key={s} selected={symptoms.includes(s)} onClick={() => toggle(s)}>
                  {s}
                </Chip>
              ))}
            </div>
            <TextField label="Main problem (optional)" value={primaryFault} onChange={(e) => setPrimaryFault(e.target.value)} supporting="e.g. Water damage" maxLength={200} />
            <TextField label="Describe it in your own words" multiline rows={4} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
          </Section>

          {error && <Notice tone="error">{error}</Notice>}

          <Button size="lg" block loading={busy} onClick={run}>
            {busy ? "Diagnosing…" : "Diagnose"}
          </Button>
        </>
      )}

      {kind === "knowledge_base" &&
        result.results.map((issue) => (
          <Card key={issue.id || issue.primary_fault} variant="elevated">
            <div className="stack-lg">
              <div className="stack">
                <span className="t-title-lg">{issue.primary_fault}</span>
                <div className="result-head">
                  <Severity value={issue.severity} />
                  {issue.estimated_time && <Pill icon={<MdSchedule />}>{issue.estimated_time}</Pill>}
                  {issue.estimated_cost && <Pill tone="primary">{formatEstimatedRepair(issue.estimated_cost)}</Pill>}
                </div>
              </div>
              <Causes causes={list(issue.possible_causes)} steps={list(issue.recommended_steps)} />
            </div>
          </Card>
        ))}

      {kind === "ai" && (
        <Card variant="elevated">
          <div className="stack-lg">
            <div className="stack">
              <span className="t-title-lg">{result.likelyProblem}</span>
              <div className="result-head">
                <Severity value={result.severity} />
                {result.confidence != null && <Pill>{result.confidence}% confident</Pill>}
              </div>
            </div>
            <div className="row">
              <MdPayments className="muted" />
              <span>
                Estimated repair: <b>{formatEstimatedRepair(result.estimatedRepair)}</b>
              </span>
            </div>
            <Causes causes={list(result.causes)} steps={list(result.steps)} />
            <p className="t-body-sm muted" style={{ margin: 0 }}>
              FixBot's answer is a guide, not a guarantee. A technician confirms the fault before any repair.
            </p>
          </div>
        </Card>
      )}

      {kind === "no_match" && (
        <Card variant="attention">
          <p className="card__title">We need a technician's eyes on this</p>
          <p className="card__text">{noMatchMessage(result)}</p>
          {list(result.suggestions).filter((s) => s?.primary_fault).length > 0 && (
            <>
              <p className="t-title-sm" style={{ margin: "12px 0 4px" }}>
                Might be related
              </p>
              <ul className="result-list">
                {list(result.suggestions)
                  .filter((s) => s?.primary_fault)
                  .map((s) => (
                    <li key={s.id || s.primary_fault}>{s.primary_fault}</li>
                  ))}
              </ul>
            </>
          )}
        </Card>
      )}

      {result && ctas}
    </Screen>
  );
}
