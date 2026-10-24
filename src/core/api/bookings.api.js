import api from "./client";

export const getSupportTypes = () =>
  api.get("/api/bookings/support-types").then((r) => r.data);

export const getBookingSlots = (date) =>
  api.get("/api/bookings/slots", { params: { date } }).then((r) => r.data);

export const createBooking = (booking) =>
  api.post("/api/bookings", booking).then((r) => r.data);

export const listBookings = (params) =>
  api.get("/api/bookings", { params }).then((r) => r.data);

export const getBooking = (id) =>
  api.get(`/api/bookings/${encodeURIComponent(id)}`).then((r) => r.data);

export const updateBookingStatus = (id, status) =>
  api
    .patch(`/api/bookings/${encodeURIComponent(id)}/status`, { status })
    .then((r) => r.data);

export const assignTechnician = (id, technicianId) =>
  api
    .patch(`/api/bookings/${encodeURIComponent(id)}/assign`, {
      technician_id: technicianId,
    })
    .then((r) => r.data);

export const startRemoteSession = (id) =>
  api
    .post(`/api/bookings/${encodeURIComponent(id)}/remote-session`)
    .then((r) => r.data);
