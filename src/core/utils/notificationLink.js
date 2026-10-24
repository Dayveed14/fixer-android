// Where a notification takes you when clicked, per role.
export function notificationLink(notif, role) {
  const id = notif?.reference_id;
  switch (notif?.reference_type) {
    case "shipment":
      if (role === "admin") return id ? `/adminshipments?open=${id}` : "/adminshipments";
      if (role === "user") return id ? `/usershipments?open=${id}` : "/usershipments";
      return null;
    case "booking":
      if (role === "admin") return "/admin/bookings";
      if (role === "technician") return "/technician/appointments";
      return id ? `/userappointment/${id}` : "/user/appointments";
    case "ticket":
      if (role === "admin") return id ? `/admin/tickets/${id}` : "/admintickets";
      if (role === "technician") return "/technician/jobs";
      return id ? `/userjob/${id}` : "/user/appointments";
    default:
      return null;
  }
}
