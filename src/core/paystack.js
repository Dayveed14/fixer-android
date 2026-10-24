/* ===========================
   PAYSTACK (app-only)
   Loads Paystack's checkout script and opens it inside the app. Same
   flow as the web: the server creates the payment first (amount and
   reference come from the server), Paystack collects it, then the
   screen sends the reference back to the server, which verifies it.
=========================== */
const SRC = "https://js.paystack.co/v1/inline.js";
let loading = null;

export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";

function loadScript() {
  if (window.PaystackPop) return Promise.resolve(window.PaystackPop);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SRC;
      script.async = true;
      script.onload = () => (window.PaystackPop ? resolve(window.PaystackPop) : reject(new Error("Paystack didn't load.")));
      script.onerror = () => {
        loading = null;
        reject(new Error("Couldn't open Paystack. Check your internet connection and try again."));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

/**
 * Opens checkout for a server-created payment intent.
 * Resolves { reference } when paid; resolves null if the customer closes it.
 */
export async function payWithPaystack(intent, metadata = {}) {
  if (!PAYSTACK_PUBLIC_KEY) throw new Error("Payments aren't set up in this build (missing VITE_PAYSTACK_PUBLIC_KEY).");
  const PaystackPop = await loadScript();
  return new Promise((resolve) => {
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: intent.email,
      amount: intent.amount_kobo,
      currency: intent.currency || "NGN",
      ref: intent.reference,
      metadata,
      callback: (response) => resolve({ reference: response?.reference || intent.reference }),
      onClose: () => resolve(null),
    });
    handler.openIframe();
  });
}
