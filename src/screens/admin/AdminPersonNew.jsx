import { useGoBack } from "../../core/nav";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MdPersonAdd } from "react-icons/md";
import { AppBar, Button, Notice, Screen, Segmented, TextField, useSnack } from "../../ui";
import api from "../../core/api/client";

export default function AdminPersonNew() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const snack = useSnack();
  const [params] = useSearchParams();
  const [f, setF] = useState({ first_name: "", last_name: "", email: "", phone: "", password: "", role: params.get("role") === "user" ? "user" : "technician" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (f.password.length < 8) {
      setError("The password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/users/create", { ...f, phone: f.phone || null });
      snack(`${f.first_name} added`);
      goBack();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Screen appBar={<AppBar title="Add an account" back />}>
      <form className="form" onSubmit={save} noValidate>
        <Segmented
          label="Role"
          value={f.role}
          onChange={(role) => setF((x) => ({ ...x, role }))}
          options={[
            { value: "technician", label: "Technician" },
            { value: "user", label: "Customer" },
          ]}
        />
        <div className="row" style={{ gap: 12 }}>
          <TextField className="grow" label="First name" value={f.first_name} onChange={set("first_name")} maxLength={80} />
          <TextField className="grow" label="Last name" value={f.last_name} onChange={set("last_name")} maxLength={80} />
        </div>
        <TextField label="Email" type="email" inputMode="email" value={f.email} onChange={set("email")} />
        <TextField label="Phone" type="tel" value={f.phone} onChange={set("phone")} maxLength={30} />
        <TextField label="Temporary password" type="text" value={f.password} onChange={set("password")} supporting="Share it with them; they can change it in Account → Change password" />
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" size="lg" icon={<MdPersonAdd />} loading={busy}>
          Create account
        </Button>
      </form>
    </Screen>
  );
}
