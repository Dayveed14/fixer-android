import { useCallback, useEffect, useState } from "react";
import api from "./api/client";

/** Notifications for the signed-in user, refreshed every minute and when the app comes back. */
export function useNotifications({ poll = 60000 } = {}) {
  const [state, setState] = useState({ items: [], unread: 0, loading: true, error: null });

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/notifications", { params: { limit: 50 } });
      const items = data?.notifications || [];
      setState({ items, unread: data?.unread ?? items.filter((n) => !n.is_read).length, loading: false, error: null });
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error }));
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, poll);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("fixer:notifications-changed", load);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("fixer:notifications-changed", load);
    };
  }, [load, poll]);

  return { ...state, reload: load };
}

export async function markRead(id) {
  await api.patch(`/api/notifications/${id}/read`);
  window.dispatchEvent(new Event("fixer:notifications-changed"));
}

export async function markAllRead() {
  await api.patch("/api/notifications/read-all");
  window.dispatchEvent(new Event("fixer:notifications-changed"));
}
