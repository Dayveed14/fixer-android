import { useState } from "react";
import { useParams } from "react-router-dom";
import { MdStar, MdStarBorder, MdCall, MdMail } from "react-icons/md";
import { AppBar, Button, Card, ErrorState, List, ListItem, Loading, Pill, Screen, Section, TextField, useAsync, useSnack } from "../../ui";
import api from "../../core/api/client";
import { getStoredUser } from "../../core/session";
import { formatDate, naira, telHref, ticketTone } from "../../lib/format";

function Stars({ value, onChange, size = 36 }) {
  return (
    <div className="row" role="radiogroup" aria-label="Rating" style={{ gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} className="icon-btn" style={{ color: n <= value ? "#f5a623" : "var(--outline)", fontSize: size }} onClick={() => onChange?.(n)} disabled={!onChange}>
          {n <= value ? <MdStar /> : <MdStarBorder />}
        </button>
      ))}
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const snack = useSnack();
  const user = getStoredUser();
  const { data: t, error, loading, reload, setData } = useAsync(() => api.get(`/api/tickets/${id}`).then((r) => r.data), [id]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading && !t) return <Screen appBar={<AppBar title="Support job" back />}><Loading /></Screen>;
  if (error) return <Screen appBar={<AppBar title="Support job" back />}><ErrorState message={error.message} onRetry={reload} /></Screen>;

  const rate = async () => {
    setBusy(true);
    try {
      await api.post("/api/ratings", { ticket_id: t.id, technician_id: t.technician_id, customer_id: user.id, rating, comment: comment.trim() || null });
      setData((x) => ({ ...x, existing_rating: rating, existing_rating_comment: comment.trim() || null }));
      snack("Thanks for your rating");
    } catch (err) {
      snack(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen appBar={<AppBar title="Support job" subtitle={t.ticket_code} back />}>
      <div className="row">
        <Pill tone={ticketTone(t.status)}>{t.status}</Pill>
        {t.priority && <Pill tone="muted">{t.priority} priority</Pill>}
      </div>

      <Card variant="tonal">
        <p className="card__title">{t.issue}</p>
        <p className="card__text">{t.device || "Device not specified"}</p>
        <dl className="kv" style={{ marginTop: 16 }}>
          <dt>Opened</dt>
          <dd>{formatDate(t.created_at)}</dd>
          <dt>Last update</dt>
          <dd>{formatDate(t.updated_at)}</dd>
          {Number(t.amount) > 0 && (
            <>
              <dt>Amount</dt>
              <dd>{naira(t.amount)}</dd>
            </>
          )}
        </dl>
      </Card>

      <Section title="Technician">
        {t.technician_name ? (
          <List>
            <ListItem icon={<MdCall />} title={t.technician_name} text={t.technician_phone || "Phone not shared"} href={t.technician_phone ? telHref(t.technician_phone) : undefined} />
            {t.technician_email && <ListItem icon={<MdMail />} leadTone="muted" title={t.technician_email} href={`mailto:${t.technician_email}`} />}
          </List>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Not assigned yet.
          </p>
        )}
      </Section>

      {t.status === "Completed" && t.technician_id && (
        <Section title="Rate the technician">
          <Card variant="outlined">
            {t.existing_rating ? (
              <div className="stack">
                <Stars value={Number(t.existing_rating)} />
                {t.existing_rating_comment && <p className="muted" style={{ margin: 0 }}>“{t.existing_rating_comment}”</p>}
                <span className="t-body-sm muted">Thanks for your feedback.</span>
              </div>
            ) : (
              <div className="stack-lg">
                <Stars value={rating} onChange={setRating} />
                <TextField label="Anything to add? (optional)" multiline rows={3} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} />
                <Button disabled={!rating} loading={busy} onClick={rate}>
                  Send rating
                </Button>
              </div>
            )}
          </Card>
        </Section>
      )}
    </Screen>
  );
}
