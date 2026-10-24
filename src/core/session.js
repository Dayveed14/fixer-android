/* ===========================
   SESSION (app-only)
   The APK can't rely on the backend's cross-site cookie, so on login
   the backend hands the app a token (it identifies itself with
   X-Fixer-Client: android). Token + the user's display details are kept
   in Capacitor Preferences (Android SharedPreferences; localStorage in
   a browser during development) and held in memory for the API client.
=========================== */
import { Preferences } from "@capacitor/preferences";

const KEY = "fixer.session";
let current = { token: null, user: null };
const listeners = new Set();

export async function loadSession() {
  try {
    const { value } = await Preferences.get({ key: KEY });
    const parsed = value ? JSON.parse(value) : null;
    if (parsed?.token && parsed?.user) current = parsed;
  } catch {
    current = { token: null, user: null };
  }
  return current;
}

export const getSession = () => current;
export const getToken = () => current.token;
export const getStoredUser = () => current.user;

function emit() {
  for (const fn of listeners) fn(current);
}

export async function setSession({ token, user }) {
  current = { token: token ?? current.token, user: user ?? current.user };
  emit();
  try {
    await Preferences.set({ key: KEY, value: JSON.stringify(current) });
  } catch {
    /* in-memory session still works for this run */
  }
}

// Why the last session ended ("expired" → sign-in shows a notice).
let endReason = null;

/** Returns and forgets why the last session ended. */
export function consumeEndReason() {
  const r = endReason;
  endReason = null;
  return r;
}

export async function clearSession(reason = null) {
  endReason = reason;
  current = { token: null, user: null };
  emit();
  try {
    await Preferences.remove({ key: KEY });
  } catch {
    /* nothing stored */
  }
}

export function onSessionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Where each role lands after signing in. */
export const homeFor = (role) => (role === "admin" ? "/a" : role === "technician" ? "/t" : "/c");
