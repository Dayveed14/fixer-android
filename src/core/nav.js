/* ===========================
   BACK NAVIGATION
   Android apps always have somewhere to go back to. When the app was
   opened straight onto a screen (a notification, a cold start) there's
   no history yet, so "back" goes to the screen's parent instead of
   doing nothing.
=========================== */
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** "/c/repairs/12" → "/c/repairs"; "/a/content/articles/new" → "/a/content/articles". */
export function parentPath(pathname) {
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  parts.pop();
  return `/${parts.join("/")}`;
}

/** React Router keeps the position in history as state.idx. */
export const hasHistory = () => (window.history.state?.idx ?? 0) > 0;

export function useGoBack() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return useCallback(
    (fallback) => {
      if (hasHistory()) navigate(-1);
      else navigate(fallback || parentPath(pathname), { replace: true });
    },
    [navigate, pathname],
  );
}
