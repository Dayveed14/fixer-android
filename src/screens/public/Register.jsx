import { setSystemBars } from "../../core/native";
import { useGoBack } from "../../core/nav";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";
import { Button, Checkbox, IconButton, Notice, TextField } from "../../ui";
import { login, register } from "../../core/api/auth.api";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Same rules as the server (utils/validate.js), checked here first.
function problem(f) {
  if (!f.first_name.trim() || !f.last_name.trim()) return "Enter your first and last name.";
  if (!EMAIL.test(f.email.trim())) return "Enter a valid email address.";
  if (f.password.length < 8 || new TextEncoder().encode(f.password).length > 72) return "Your password must be 8 to 72 characters.";
  if (f.password !== f.confirm) return "The passwords don't match.";
  if (!f.agree) return "Please accept the privacy policy to continue.";
  return null;
}

export default function Register() {
  const navigate = useNavigate();
  // Navy header behind the status bar → light icons.
  useEffect(() => {
    setSystemBars({ onDark: true });
  }, []);
  const goBack = useGoBack();
  const { state } = useLocation();
  const [f, setF] = useState({ first_name: "", last_name: "", email: "", phone: "", password: "", confirm: "", agree: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const p = problem(f);
    if (p) {
      setError(p);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register({ first_name: f.first_name.trim(), last_name: f.last_name.trim(), email: f.email.trim(), phone: f.phone.trim() || null, password: f.password });
      await login({ email: f.email.trim(), password: f.password });
      navigate(state?.from?.startsWith("/c") ? state.from : "/c", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <div className="auth-top">
        <IconButton icon={<MdArrowBack />} label="Back" onClick={() => goBack("/login")} />
        <h1>Create your account</h1>
        <p>It takes a minute. You'll use it to book and track repairs.</p>
      </div>
      <form className="auth-sheet" onSubmit={submit} noValidate>
        <div className="row" style={{ gap: 12 }}>
          <TextField className="grow" label="First name" value={f.first_name} onChange={set("first_name")} autoComplete="given-name" maxLength={80} />
          <TextField className="grow" label="Last name" value={f.last_name} onChange={set("last_name")} autoComplete="family-name" maxLength={80} />
        </div>
        <TextField label="Email" type="email" inputMode="email" value={f.email} onChange={set("email")} autoComplete="email" />
        <TextField label="Phone (optional)" type="tel" inputMode="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" supporting="So a technician can call you" maxLength={30} />
        <TextField label="Password" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" supporting="At least 8 characters" />
        <TextField label="Confirm password" type="password" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" />
        <Checkbox
          checked={f.agree}
          onChange={set("agree")}
          label={
            <>
              I agree to Fixer's <Link to="/info/privacy">privacy policy</Link> and <Link to="/info/shipment">repair policy</Link>.
            </>
          }
        />
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" size="lg" block loading={busy}>
          Create account
        </Button>
        <p className="center muted" style={{ margin: 0 }}>
          Already have an account? <Link to="/login" state={state}>Sign in</Link>
        </p>
      </form>
    </div>
  );
}
