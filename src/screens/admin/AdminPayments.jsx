import { useState } from "react";
import { MdPayments, MdWarningAmber, MdCheckCircle, MdError } from "react-icons/md";
import { AppBar, Card, Chip, EmptyState, ErrorState, List, ListItem, Pill, Screen, Section, Sheet, SkeletonList, StatTile, useAsync } from "../../ui";
import api from "../../core/api/client";
import { listPayments } from "../../core/api/payments.api";
import { formatDateTime, nairaFromKobo } from "../../lib/format";

const FILTERS = [
  { id: "all", label: "All", params: {} },
  { id: "unused", label: "Paid, not used", params: { status: "success", unfulfilled: "true" } },
  { id: "success", label: "Paid", params: { status: "success" } },
  { id: "pending", label: "Pending", params: { status: "pending" } },
  { id: "failed", label: "Failed", params: { status: "failed" } },
  { id: "mismatch", label: "Mismatch", params: { status: "mismatch" } },
];

const PURPOSES = { booking: "Support call", shipment: "Pickup fee", repair: "Repair + return", return: "Return delivery" };
const TONES = { success: "ok", pending: "warn", failed: "error", abandoned: "muted", reversed: "error", mismatch: "error" };

function PaymentSheet({ payment, onClose }) {
  const { data: events, loading } = useAsync(() => api.get(`/api/payments/${encodeURIComponent(payment.reference)}/events`).then((r) => r.data), [payment.reference]);
  return (
    <Sheet open onClose={onClose} title={nairaFromKobo(payment.amount_kobo)} subtitle={`${PURPOSES[payment.purpose] || payment.purpose} · ${payment.email}`}>
      <Card variant="tonal">
        <dl className="kv">
          <dt>Reference</dt>
          <dd className="mono">{payment.reference}</dd>
          <dt>Status</dt>
          <dd>{payment.status}</dd>
          <dt>Used for</dt>
          <dd>{payment.entity_type ? `${payment.entity_type.replace("_", " ")} #${payment.entity_id}` : "Nothing yet"}</dd>
          {payment.failure_reason && (
            <>
              <dt>Reason</dt>
              <dd>{payment.failure_reason}</dd>
            </>
          )}
        </dl>
      </Card>
      {payment.status === "success" && !payment.entity_id && (
        <Card variant="attention">
          <p className="card__text">The customer paid but nothing was created. Contact them to finish, or refund in the Paystack dashboard.</p>
        </Card>
      )}
      <Section title="History">
        {loading ? (
          <SkeletonList rows={2} />
        ) : (
          <ol className="timeline">
            {(events || []).map((e) => (
              <li key={e.id} className="is-done">
                <span className="timeline__dot" aria-hidden="true" />
                <div>
                  <span className="timeline__label">
                    {e.event.replace("_", " ")}
                    {e.from_status && e.to_status && e.from_status !== e.to_status ? `: ${e.from_status} → ${e.to_status}` : ""}
                  </span>
                  <span className="timeline__meta">
                    {formatDateTime(e.created_at)} · via {e.source}
                  </span>
                  {e.detail && <span className="timeline__note">{e.detail}</span>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </Sheet>
  );
}

export default function AdminPayments() {
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);
  const { data: rows, error, loading, reload } = useAsync(() => listPayments(FILTERS.find((f) => f.id === filter).params), [filter]);
  const { data: metrics } = useAsync(() => api.get("/api/health/metrics").then((r) => r.data));

  const unused = metrics?.payments?.unfulfilled ?? 0;
  const failed = metrics?.payments?.failed_last_hour ?? 0;
  const errors = metrics?.server_errors_last_5_min ?? 0;

  return (
    <Screen appBar={<AppBar title="Payments & alerts" back />}>
      {metrics && (
        <div className="stats">
          <StatTile icon={unused ? <MdWarningAmber /> : <MdCheckCircle />} value={unused} label="Paid but unused (15+ min)" tone={unused ? "warn" : undefined} />
          <StatTile icon={<MdError />} value={failed} label="Failed in the last hour" tone={failed >= 5 ? "warn" : undefined} />
          <StatTile icon={<MdError />} value={errors} label="Server errors (5 min)" tone={errors ? "warn" : undefined} />
          <StatTile icon={<MdPayments />} value={metrics.alerts_sent} label={`Alerts sent · email ${metrics.alert_channels?.email ? "on" : "off"}`} />
        </div>
      )}
      {metrics?.recent_alerts?.length > 0 && (
        <Section title="Recent alerts">
          <List>
            {metrics.recent_alerts.slice(0, 5).map((a) => (
              <ListItem key={`${a.key}-${a.at}`} icon={<MdWarningAmber />} leadTone="warn" over={formatDateTime(a.at)} title={a.title} />
            ))}
          </List>
        </Section>
      )}

      <div className="chips chips--scroll">
        {FILTERS.map((f) => (
          <Chip key={f.id} selected={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {loading && !rows ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : !rows?.length ? (
        <EmptyState icon={<MdPayments />} title="No payments match" />
      ) : (
        <List>
          {rows.map((p) => (
            <ListItem
              key={p.reference}
              icon={<MdPayments />}
              leadTone={TONES[p.status] === "error" ? "error" : p.status === "success" && !p.entity_id ? "warn" : undefined}
              over={`${formatDateTime(p.created_at)} · ${PURPOSES[p.purpose] || p.purpose}`}
              title={nairaFromKobo(p.amount_kobo)}
              text={p.email}
              trailing={<Pill tone={p.status === "success" && !p.entity_id ? "warn" : TONES[p.status]}>{p.status === "success" && !p.entity_id ? "unused" : p.status}</Pill>}
              onClick={() => setOpen(p)}
            />
          ))}
        </List>
      )}
      {open && <PaymentSheet key={open.reference} payment={open} onClose={() => setOpen(null)} />}
    </Screen>
  );
}
