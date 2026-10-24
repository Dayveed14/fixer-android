import { describe, it, expect } from "vitest";
import { notificationLink } from "./notificationLink";

describe("notificationLink", () => {
  it.each([
    [{ reference_type: "shipment", reference_id: 3 }, "admin", "/adminshipments?open=3"],
    [{ reference_type: "shipment", reference_id: 3 }, "user", "/usershipments?open=3"],
    [{ reference_type: "shipment", reference_id: 3 }, "technician", null],
    [{ reference_type: "booking", reference_id: 7 }, "user", "/userappointment/7"],
    [{ reference_type: "ticket", reference_id: 9 }, "admin", "/admin/tickets/9"],
    [{ reference_type: "something" }, "user", null],
  ])("%j as %s -> %s", (notif, role, link) => {
    expect(notificationLink(notif, role)).toBe(link);
  });
});
