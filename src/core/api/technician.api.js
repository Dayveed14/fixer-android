import api from "./client";

// Everything assigned to the logged-in technician (the server scopes
// each list to the caller).
export const listMyAppointments = () => api.get("/api/bookings").then((r) => r.data);
export const listMyRepairs = () => api.get("/api/shipments/assigned").then((r) => r.data);
export const listMyTickets = () => api.get("/api/tickets").then((r) => r.data);

export const setAppointmentStatus = (id, status) =>
  api.patch(`/api/bookings/${encodeURIComponent(id)}/status`, { status }).then((r) => r.data);

export const startRemoteSession = (id) =>
  api.post(`/api/bookings/${encodeURIComponent(id)}/remote-session`).then((r) => r.data);

export const createMeetingLink = (id) =>
  api.post(`/api/bookings/${encodeURIComponent(id)}/meeting`).then((r) => r.data);

export const reportRepair = (id, { outcome, note }) =>
  api
    .post(`/api/shipments/${encodeURIComponent(id)}/repair-result`, { outcome, note })
    .then((r) => r.data);

// No amount: completing work never asks for one.
export const setTicketStatus = (id, status) =>
  api.patch(`/api/tickets/${encodeURIComponent(id)}/status`, { status }).then((r) => r.data);
