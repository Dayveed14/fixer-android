import { useState } from "react";
import { MdSend } from "react-icons/md";
import { AppBar, Button, Notice, Screen, TextField } from "../../ui";
import api from "../../core/api/client";
import { getStoredUser } from "../../core/session";
import { fullName } from "../../lib/format";

export default function Contact() {
  const user = getStoredUser();
  const [form, setForm] = useState({ name: fullName(user), email: user?.email || "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const send = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please add your name, email and a message.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/contact", form);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen appBar={<AppBar title="Contact support" back />}>
      {sent ? (
        <Notice tone="ok">
          <p>Message sent. We'll reply to {form.email}.</p>
        </Notice>
      ) : (
        <form className="form" onSubmit={send} noValidate>
          <TextField label="Your name" value={form.name} onChange={set("name")} maxLength={120} autoComplete="name" />
          <TextField label="Email" type="email" value={form.email} onChange={set("email")} autoComplete="email" inputMode="email" />
          <TextField label="Subject (optional)" value={form.subject} onChange={set("subject")} maxLength={200} />
          <TextField label="Message" multiline rows={6} value={form.message} onChange={set("message")} maxLength={5000} />
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" size="lg" icon={<MdSend />} loading={busy}>
            Send message
          </Button>
        </form>
      )}
    </Screen>
  );
}
