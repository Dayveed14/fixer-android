# Fixer for Android

The Fixer app for Android phones. It's a React + Vite app with its own
Android design (Material style: bottom navigation, cards, bottom sheets,
floating buttons, dark mode), packaged as an APK with Capacitor and Android
Studio.

- **Same backend** as the website: [fixer-backend](https://github.com/Dayveed14/fixer-backend).
- **Same logic** as the website ([fixer-vite](https://github.com/Dayveed14/fixer-vite)): booking rules, prices, payments, repair lifecycle and API calls are copied file-for-file (see [Shared logic](#shared-logic)).
- **Different screens**, built for a phone.

It covers every role: guests (home, FixBot, guides, help, sign in/up),
customers, technicians and admins.

## Requirements

- Node 22.19 or newer (the test tools need it; Node 20 fails with `Cannot read properties of undefined (reading 'bind')`)
- Android Studio (Ladybug or newer) with Android SDK 36, for building the APK
- The backend version that supports the app (23 Oct 2026 or later). It returns a
  session token to the app and accepts `X-Fixer-Client: android`. Older
  backends refuse the app's sign-in with a clear message.

## Set up

```bash
npm ci
cp .env.example .env        # set VITE_PAYSTACK_PUBLIC_KEY (pk_test_… or pk_live_…)
```

| Variable | Needed | What it is |
| --- | --- | --- |
| `VITE_API_BASE_URL` | yes | The backend, e.g. `https://fixer-backend-7mng.onrender.com` |
| `VITE_PAYSTACK_PUBLIC_KEY` | yes | Paystack **public** key. Never the secret key. |
| `VITE_API_TIMEOUT_MS` | no | Request timeout (default 30000) |
| `VITE_MESHCENTRAL_WEB_URL` | no | MeshCentral console for technicians' remote sessions |

These are baked in when you build, so rebuild after changing them.

## Build the APK

```bash
npm run android      # = build the web app → copy into android/ → open Android Studio
```

In Android Studio:
- **Test on a phone:** plug it in (USB debugging on) and press ▶ Run.
- **APK to share:** use the Build menu's *APK* option (named "Build APK(s)" or "Generate APKs" depending on the Android Studio version).
- **Play Store release:** Build → Generate Signed App Bundle / APK. Keep the
  keystore and its passwords safe; you need the same one for every update.

After changing code, run `npm run sync` (build + copy) and press ▶ Run again.

The app id is `app.fixerng`, the same as the previous wrapped-website APK, so
installing this one replaces it on a phone. Bump `versionCode` and
`versionName` in `android/app/build.gradle` for each release.

**Without Android Studio:** every push to GitHub builds a debug APK (Actions →
CI → *fixer-debug-apk*). Set `VITE_PAYSTACK_PUBLIC_KEY` (and optionally
`VITE_API_BASE_URL`) under the repository's Settings → Secrets and variables →
Actions → **Variables**.

### Icon and splash screen

Sources are in `assets/` (FixBot on Fixer's blueprint navy). After editing
them, run `npm run assets` to regenerate every Android size.

## Develop in the browser

```bash
npm run dev          # http://localhost:5173
```

Screens are easiest to build in Chrome DevTools' phone view (e.g. Pixel 7).
Android-only features (back button, status bar, splash) do nothing in the
browser. To use a local backend, set `VITE_API_BASE_URL=http://localhost:4000`.

```bash
npm test             # logic, session, API client and component tests
npm run check-shared # is the shared logic still identical to the web repo?
```

## How it works

### Sessions

A phone app can't rely on the website's cross-site cookie. On sign-in the
app identifies itself (`X-Fixer-Client: android`), and the backend returns
a token. The app keeps it in Android's app-private storage (Capacitor
Preferences) and sends it as `Authorization: Bearer …`. Changing the
password signs out every other device and hands this one a fresh token. An
expired session sends the user to sign in with a notice.

### Payments

The same flow as the website. The server prices the request and creates the
payment, Paystack's checkout opens inside the app, and the app then sends
the reference back for the server to verify. If the confirmation step
fails, retrying with the same reference never charges twice.

### Android behaviour

- Hardware back button: closes the open sheet/dialog first, goes back a
  screen, and leaves the app from a main tab. A screen opened from a
  notification goes "back" to its parent screen.
- Edge-to-edge (Android 15+): the app draws behind the status and navigation
  bars and pads itself (`SystemBars` with `insetsHandling: "css"`). Status-bar
  icons are light over navy headers and follow the theme elsewhere.
- Light and dark theme follow the phone's setting.
- Calls, WhatsApp, Meet links and emails open in the phone's own apps.

### Screens

| Role | Tabs | Highlights |
| --- | --- | --- |
| Guest | Home · FixBot · Learn · Help · Sign in | Live prices, FixBot diagnosis, guides, contact form |
| Customer | Home · Get help · Repairs · Activity · Account | Book a call, send a device in (area picker with fees), approve and pay quotes, confirm delivery, rate jobs, devices, notifications |
| Technician | Today · Jobs · Calls · Repairs · Account | Call / WhatsApp / video / remote session, mark calls done, report repairs |
| Admin | Home · Bookings · Repairs · Tickets · More | Assign technicians, move repairs along, send quotes, tickets, people, payments & alerts, pricing, articles and videos |

Every role can change their password under Account.

### Code layout

```
src/
  core/          logic (see core/README.md)
    api/         API calls — identical to the web app, except client.js
    utils/       booking rules, repair stages, FixBot, jobs — identical to the web app
    session.js   token + user, stored with Capacitor Preferences
    paystack.js  opens Paystack checkout
    native.js    back button, system bars, splash, external links
    nav.js       back navigation with a sensible fallback
    routes.js    notification → app screen
  ui/            the design system: theme.css (colour/type tokens, light + dark),
                 components.css, index.jsx (AppBar, BottomNav, Card, ListItem,
                 TextField, PickerField, Sheet, Dialog, Chip, Segmented, Tabs, Fab…)
  screens/       public/, customer/, tech/, admin/, shared/
  lib/format.js  money, dates (always Abuja time), phone links
android/         the Android Studio project (generated by Capacitor, committed)
assets/          icon and splash sources
```

## Shared logic

The website and the app must apply the same rules. These files are copied
exactly between the two repos:

| App | Web |
| --- | --- |
| `src/core/utils/{schedule,shipmentStatus,diagnosis,notificationLink,richText}.js` | `src/utils/…` |
| `src/core/utils/jobs.js` | `src/components/technician/jobs.js` |
| `src/core/api/{bookings,shipments,payments,technician,pricing,diagnosis}.api.js` | `src/api/…` |

When you change one, copy it to the other, then run `npm run check-shared`
(it expects the web repo at `../fixer-vite`, or pass its path).

## Troubleshooting

- **"This server doesn't support the Android app yet"** at sign-in: deploy the
  backend from 23 Oct 2026 or later.
- **Blank screen after install:** run `npm run sync` before building (the
  web build must be copied into `android/`).
- **Local backend over `http://`:** Android blocks plain HTTP by default. Use
  the deployed HTTPS backend, or for local testing only add
  `android:usesCleartextTraffic="true"` to `AndroidManifest.xml`.
