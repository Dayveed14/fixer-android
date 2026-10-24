// Maps a notification to the app screen it's about. Same targets as the
// web's notificationLink.js, translated to the app's routes.
export function appLinkFor(notif, role) {
  const id = notif?.reference_id;
  switch (notif?.reference_type) {
    case "shipment":
      if (role === "admin") return id ? `/a/repairs/${id}` : "/a/repairs";
      if (role === "technician") return "/t/repairs";
      return id ? `/c/repairs/${id}` : "/c/repairs";
    case "booking":
      if (role === "admin") return "/a/bookings";
      if (role === "technician") return "/t/calls";
      return id ? `/c/appointments/${id}` : "/c/activity";
    case "ticket":
      if (role === "admin") return id ? `/a/tickets/${id}` : "/a/tickets";
      if (role === "technician") return "/t/jobs";
      return id ? `/c/jobs/${id}` : "/c/activity";
    default:
      return null;
  }
}
