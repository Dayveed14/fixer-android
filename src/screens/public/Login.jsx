import { setSystemBars } from "../../core/native";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdArrowBack, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { Button, IconButton, Notice, TextField } from "../../ui";
import { login } from "../../core/api/auth.api";
import { consumeEndReason, homeFor } from "../../core/session";

export default function Login() {
  const navigate = useNavigate();
  // Navy header behind the status bar → light icons.
  useEffect(() => {
    setSystemBars({ onDark: true });
  }, []);
  const { state } = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [expired] = useState(() => consumeEndReason() === "expired" || Boolean(state?.expired));

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const user = await login({ email: email.trim(), password });
      const from = state?.from;
      // Only follow "from" into the signed-in user's own area.
      const home = homeFor(user.role);
      navigate(from && from.startsWith(home) ? from : home, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <div className="auth-top">
        <IconButton icon={<MdArrowBack />} label="Back" onClick={() => navigate("/")} />
        <h1>Welcome back</h1>
        <p>Sign in to book technicians and track your repairs.</p>
      </div>
      <form className="auth-sheet" onSubmit={submit} noValidate>
        {expired && <Notice tone="warn">Your session ended. Please sign in again.</Notice>}
        <TextField label="Email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField
          label="Password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          trailing={<IconButton icon={show ? <MdVisibilityOff /> : <MdVisibility />} label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} />}
        />
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" size="lg" block loading={busy}>
          Sign in
        </Button>
        <p className="center muted" style={{ margin: 0 }}>
          New to Fixer? <Link to="/register" state={state}>Create an account</Link>
        </p>
        <p className="center t-body-sm muted" style={{ margin: 0 }}>
          Forgot your password? Email <a href="mailto:support@fixerng.app">support@fixerng.app</a>
        </p>
      </form>
    </div>
  );
}
