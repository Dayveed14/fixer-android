# core/ — logic shared with the web app

Everything in this folder is the same logic as the web repo (fixer-vite),
so the app and the website behave identically. When you fix a rule in one,
make the same change in the other.

| Here | Web repo | Notes |
| --- | --- | --- |
| `api/*.api.js` | `src/api/*.api.js` | identical |
| `api/client.js` | `src/api/client.js` | **adapted:** Bearer token instead of cookie, `X-Fixer-Client: android` |
| `utils/schedule.js`, `shipmentStatus.js`, `diagnosis.js`, `notificationLink.js`, `richText.js` | `src/utils/` | identical (+ tests) |
| `utils/jobs.js` | `src/components/technician/jobs.js` | identical (+ tests) |
| `session.js`, `paystack.js`, `native.js` | — | app-only |

`notificationLink.js` returns web paths; `routes.js` maps them to the app's screens.
