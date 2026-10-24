import api from "./client";

export const getDispatchZones = () =>
  api.get("/api/shipments/zones").then((r) => r.data);

export const getPickupSlots = (date) =>
  api.get("/api/shipments/slots", { params: { date } }).then((r) => r.data);

export const createShipment = (shipment) =>
  api.post("/api/shipments", shipment).then((r) => r.data);

export const listShipments = () =>
  api.get("/api/shipments").then((r) => r.data);

export const listUserShipments = (email) =>
  api
    .get(`/api/shipments/user/${encodeURIComponent(email)}`)
    .then((r) => r.data);

export const getShipment = (idOrReference) =>
  api
    .get(`/api/shipments/${encodeURIComponent(idOrReference)}`)
    .then((r) => r.data);

/** Admin: next status. Starting a repair needs { technician_id }. */
export const updateShipmentStatus = (id, status, extra = {}) =>
  api
    .patch(`/api/shipments/${encodeURIComponent(id)}/status`, { status, ...extra })
    .then((r) => r.data);

/** Staff: send the diagnosis + repair cost (moves to waiting for approval). */
export const sendQuote = (id, { diagnosis, repair_cost }) =>
  api
    .post(`/api/shipments/${encodeURIComponent(id)}/quote`, { diagnosis, repair_cost })
    .then((r) => r.data);

/** Customer: "approve" (with payment) or "decline" (with payment if required). */
export const respondToQuote = (id, { decision, payment_reference }) =>
  api
    .post(`/api/shipments/${encodeURIComponent(id)}/approval`, { decision, payment_reference })
    .then((r) => r.data);

/** Customer: "I've received my device". */
export const confirmDelivery = (id) =>
  api
    .post(`/api/shipments/${encodeURIComponent(id)}/confirm-delivery`)
    .then((r) => r.data);
