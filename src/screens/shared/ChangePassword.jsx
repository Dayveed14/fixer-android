import { useGoBack } from "../../core/nav";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { AppBar, Button, IconButton, Notice, Screen, TextField, useSnack } from "../../ui";
import { changePassword } from "../../core/api/auth.api";

const MIN = 8;
const MAX = 72;

/** Same rules as the server and the web app. */
export function passwordFormProblem({ current, next, confirm }) {
  if (!current) return "Enter your current password.";
  if (next.length < MIN || new TextEncoder().encode(next).length > MAX) return `Your new password must be ${MIN} to ${MAX} characters.`;
  if (next === current) return "Choose a password you haven't just used.";
  if (next !== confirm) return "The new passwords don't match.";
  return null;
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const snack = useSnack();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setError(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    const p = passwordFormProblem(form);
    if (p) {
      setError(p);
      return;
    }
    setBusy(true);
    try {
      await changePassword({ currentPassword: form.current, newPassword: form.next });
      snack("Password changed. Your other devices are signed out.");
      goBack();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const type = show ? "text" : "password";
  const eye = <IconButton icon={show ? <MdVisibilityOff /> : <MdVisibility />} label={show ? "Hide passwords" : "Show passwords"} onClick={() => setShow(!show)} />;

  return (
    <Screen appBar={<AppBar title="Change password" back />}>
      <p className="muted" style={{ margin: 0 }}>
        Changing your password signs you out on every other device. You'll stay signed in here.
      </p>
      <form className="form" onSubmit={submit} noValidate>
        <TextField label="Current password" type={type} autoComplete="current-password" value={form.current} onChange={set("current")} trailing={eye} />
        <TextField
          label="New password"
          type={type}
          autoComplete="new-password"
          value={form.next}
          onChange={set("next")}
          supporting={`At least ${MIN} characters${form.next ? ` (${form.next.length} so far)` : ""}`}
        />
        <TextField label="Confirm new password" type={type} autoComplete="new-password" value={form.confirm} onChange={set("confirm")} />
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" size="lg" block loading={busy}>
          Change password
        </Button>
      </form>
    </Screen>
  );
}
