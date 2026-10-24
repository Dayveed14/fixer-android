import { useGoBack } from "../../core/nav";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdDelete, MdSave, MdCall, MdMail } from "react-icons/md";
import { AppBar, Avatar, Button, ErrorState, IconButton, List, ListItem, Loading, Notice, Screen, SelectField, TextField, useAsync, useConfirm, useSnack } from "../../ui";
import api from "../../core/api/client";
import { fullName, telHref } from "../../lib/format";

export default function AdminPersonEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const snack = useSnack();
  const confirm = useConfirm();
  const { data: person, error, loading, reload } = useAsync(() => api.get(`/api/users/${id}`).then((r) => r.data), [id]);
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (person) setF({ first_name: person.first_name || "", last_name: person.last_name || "", phone: person.phone || "", role: person.role });
  }, [person]);

  if (loading && !person) return <Screen appBar={<AppBar title="Account" back />}><Loading /></Screen>;
  if (error) return <Screen appBar={<AppBar title="Account" back />}><ErrorState message={error.message} onRetry={reload} /></Screen>;
  if (!f) return null;

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    setBusy(true);
    setSaveError(null);
    try {
      await api.patch(`/api/users/${id}`, f);
      snack("Saved");
      goBack();
    } catch (err) {
      setSaveError(err.message);
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!(await confirm({ title: `Delete ${fullName(person)}?`, body: "Accounts with bookings, repairs or payments can't be deleted.", confirm: "Delete", danger: true }))) return;
    try {
      await api.delete(`/api/users/${id}`);
      snack("Account deleted");
      goBack();
    } catch (err) {
      snack(err.message);
    }
  };

  return (
    <Screen appBar={<AppBar title="Edit account" back actions={<IconButton icon={<MdDelete />} label="Delete account" onClick={remove} />} />}>
      <div className="profile-head">
        <Avatar name={fullName(person)} size="lg" />
        <h2>{fullName(person)}</h2>
      </div>
      <List>
        <ListItem icon={<MdMail />} leadTone="muted" title={person.email} href={`mailto:${person.email}`} />
        {person.phone && <ListItem icon={<MdCall />} leadTone="muted" title={person.phone} href={telHref(person.phone)} />}
      </List>
      <div className="form">
        <div className="row" style={{ gap: 12 }}>
          <TextField className="grow" label="First name" value={f.first_name} onChange={set("first_name")} maxLength={80} />
          <TextField className="grow" label="Last name" value={f.last_name} onChange={set("last_name")} maxLength={80} />
        </div>
        <TextField label="Phone" type="tel" value={f.phone} onChange={set("phone")} maxLength={30} />
        <SelectField
          label="Role"
          value={f.role}
          onChange={set("role")}
          options={[
            { value: "user", label: "Customer" },
            { value: "technician", label: "Technician" },
          ]}
          supporting={f.role !== person.role ? "They'll be signed out and need to sign in again." : undefined}
        />
        {saveError && <Notice tone="error">{saveError}</Notice>}
        <Button size="lg" icon={<MdSave />} loading={busy} onClick={save}>
          Save changes
        </Button>
      </div>
    </Screen>
  );
}
