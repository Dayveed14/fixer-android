import { useGoBack } from "../../core/nav";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdDelete, MdSave } from "react-icons/md";
import { AppBar, Button, ErrorState, IconButton, Loading, Notice, Screen, Section, Segmented, SelectField, TextField, useAsync, useConfirm, useSnack } from "../../ui";
import api from "../../core/api/client";
import { formatDate } from "../../lib/format";

const STATUSES = ["Open", "In Progress", "Pending", "Completed"];
const PRIORITIES = ["Low", "Medium", "High"];

export default function AdminTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const snack = useSnack();
  const confirm = useConfirm();
  const { data, error, loading, reload } = useAsync(async () => {
    const [ticket, technicians] = await Promise.all([api.get(`/api/tickets/${id}`).then((r) => r.data), api.get("/api/users/technicians").then((r) => r.data)]);
    return { ticket, technicians };
  }, [id]);
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (data?.ticket) {
      const t = data.ticket;
      setF({
        customer_name: t.customer_name || "",
        issue: t.issue || "",
        device: t.device || "",
        priority: t.priority || "Medium",
        status: t.status || "Open",
        amount: t.amount == null ? "" : String(t.amount),
        technician_id: t.technician_id ? String(t.technician_id) : "",
      });
    }
  }, [data]);

  if (loading && !data) return <Screen appBar={<AppBar title="Ticket" back />}><Loading /></Screen>;
  if (error) return <Screen appBar={<AppBar title="Ticket" back />}><ErrorState message={error.message} onRetry={reload} /></Screen>;
  if (!f) return null;

  const t = data.ticket;
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    setSaveError(null);
    try {
      await api.patch(`/api/tickets/${id}`, { ...f, amount: f.amount === "" ? "" : Number(f.amount), technician_id: f.technician_id ? Number(f.technician_id) : null });
      snack("Ticket saved");
      reload();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!(await confirm({ title: `Delete ${t.ticket_code}?`, body: "This can't be undone.", confirm: "Delete", danger: true }))) return;
    try {
      await api.delete(`/api/tickets/${id}`);
      snack("Ticket deleted");
      goBack();
    } catch (err) {
      snack(err.message);
    }
  };

  return (
    <Screen appBar={<AppBar title={t.ticket_code} subtitle={`Opened ${formatDate(t.created_at)}`} back actions={<IconButton icon={<MdDelete />} label="Delete ticket" onClick={remove} />} />}>
      <Section title="Status">
        <Segmented label="Status" value={f.status} onChange={(v) => setF((x) => ({ ...x, status: v }))} options={STATUSES.map((s) => ({ value: s, label: s === "In Progress" ? "In progress" : s }))} />
      </Section>
      <Section title="Job">
        <div className="form">
          <TextField label="Customer" value={f.customer_name} onChange={set("customer_name")} maxLength={120} />
          <TextField label="Issue" multiline rows={4} value={f.issue} onChange={set("issue")} maxLength={2000} />
          <TextField label="Device" value={f.device} onChange={set("device")} maxLength={120} />
          <SelectField label="Priority" value={f.priority} onChange={set("priority")} options={PRIORITIES} />
          <SelectField label="Technician" value={f.technician_id} onChange={set("technician_id")} placeholder="Unassigned" options={data.technicians.map((x) => ({ value: String(x.id), label: `${x.first_name} ${x.last_name}` }))} />
          <TextField label="Amount (₦, optional)" type="number" inputMode="numeric" value={f.amount} onChange={set("amount")} />
        </div>
      </Section>
      {(t.customer_email || t.customer_phone) && (
        <p className="t-body-sm muted" style={{ margin: 0 }}>
          Customer contact: {[t.customer_phone, t.customer_email].filter(Boolean).join(" · ")}
        </p>
      )}
      {saveError && <Notice tone="error">{saveError}</Notice>}
      <Button size="lg" icon={<MdSave />} loading={busy} onClick={save}>
        Save changes
      </Button>
    </Screen>
  );
}
