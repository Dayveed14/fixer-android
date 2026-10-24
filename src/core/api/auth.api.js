import api from "./client";
import { clearSession, getToken, setSession } from "../session";

// Same endpoints as the web app; the token comes back because every
// request from the app says X-Fixer-Client: android.

export async function login(credentials) {
  const { data } = await api.post("/api/users/login", credentials);
  const { token, ...user } = data;
  if (!token) throw new Error("This server doesn't support the Android app yet. Please update the backend.");
  await setSession({ token, user });
  return user;
}

export const register = (details) => api.post("/api/users/register", details).then((r) => r.data);

export async function logout() {
  try {
    if (getToken()) await api.post("/api/users/logout");
  } catch {
    /* signing out locally is what matters */
  }
  await clearSession();
}

export const getMe = () => api.get("/api/users/me").then((r) => r.data);

/** Changes the password; other devices are signed out, this one gets a fresh token. */
export async function changePassword({ currentPassword, newPassword }) {
  const { data } = await api.patch("/api/users/me/password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  if (data?.token) await setSession({ token: data.token });
  return data;
}
