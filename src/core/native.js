/* ===========================
   NATIVE ANDROID HOOKS (app-only)
   Status bar colour, splash screen, hardware back button and opening
   links outside the app. Everything is a no-op in a desktop browser,
   so `npm run dev` works for building screens.
=========================== */
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";
import { App } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";

export const isNative = () => Capacitor.isNativePlatform();

/**
 * The app sits between the system bars (Android pads it), and both bars
 * are Fixer navy, so their icons are always light. `onDark` is accepted
 * for older call sites and ignored.
 */
// eslint-disable-next-line no-unused-vars
export async function setSystemBars(_options = {}) {
  if (!isNative()) return;
  try {
    await SystemBars.setStyle({ style: SystemBarsStyle.Dark });
  } catch {
    /* very old Android: system default */
  }
}

// Kept for older call sites.
export const setStatusBar = ({ dark = false } = {}) => setSystemBars({ onDark: dark });

export async function hideSplash() {
  if (!isNative()) return;
  try {
    await SplashScreen.hide();
  } catch {
    /* not shown */
  }
}

/**
 * Android back button: go back in the app; on a top-level screen,
 * leave the app (like any Android app).
 */
export function onHardwareBack(handler) {
  if (!isNative()) return () => {};
  const sub = App.addListener("backButton", ({ canGoBack }) => handler({ canGoBack }));
  return () => {
    sub.then((s) => s.remove()).catch(() => {});
  };
}

export const exitApp = () => (isNative() ? App.exitApp() : undefined);

/** Phone calls, WhatsApp, Meet links, maps: hand them to Android. */
export function openExternal(url) {
  // In the APK, navigating to a non-app URL is handed to Android
  // (dialler, WhatsApp, browser, mail) and the app stays where it is.
  if (isNative()) window.location.href = url;
  else window.open(url, "_blank", "noopener,noreferrer");
}
