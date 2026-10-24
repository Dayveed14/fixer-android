import api from "./client";

/**
 * Asks the server to price and register a payment BEFORE opening
 * Paystack. Returns { reference, amount, amount_kobo, currency, email }.
 * Use exactly this reference and amount_kobo for the Paystack popup.
 *
 *   initializePayment({ purpose: "booking", support_type, booking_date, booking_time })
 *   initializePayment({ purpose: "shipment", zone, pickup_date, pickup_time })
 */
export const initializePayment = (details) =>
  api.post("/api/payments/initialize", details).then((r) => r.data);

export const getPayment = (reference) =>
  api
    .get(`/api/payments/${encodeURIComponent(reference)}`)
    .then((r) => r.data);

export const listPayments = (params) =>
  api.get("/api/payments", { params }).then((r) => r.data);
