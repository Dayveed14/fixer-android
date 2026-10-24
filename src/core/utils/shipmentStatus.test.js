import { describe, it, expect } from "vitest";
import { buildTimeline, timeLeft } from "./shipmentStatus";

const states = (shipment) => Object.fromEntries(buildTimeline(shipment).map((s) => [s.value, s.state]));

describe("buildTimeline", () => {
  it("marks earlier steps done, the current one current, later ones upcoming", () => {
    const s = states({ status: "diagnosis", events: [] });
    expect(s.pickup_scheduled).toBe("done");
    expect(s.device_collected).toBe("done");
    expect(s.diagnosis).toBe("current");
    expect(s.repair).toBe("upcoming");
  });

  it("skips repair and quality check when the quote was declined", () => {
    const s = states({ status: "ready_for_delivery", approval_status: "declined", events: [] });
    expect(s.repair).toBe("skipped");
    expect(s.quality_check).toBe("skipped");
    expect(s.ready_for_delivery).toBe("current");
  });

  it("shows delivered as done, not current", () => {
    expect(states({ status: "delivered", events: [] }).delivered).toBe("done");
  });

  it("uses event times and notes", () => {
    const [first] = buildTimeline({
      status: "courier_assigned",
      events: [{ status: "pickup_scheduled", created_at: "2026-11-02T09:00:00Z", note: "Paid" }],
    });
    expect(first.reachedAt).toBe("2026-11-02T09:00:00Z");
    expect(first.notes).toEqual(["Paid"]);
  });
});

describe("timeLeft", () => {
  const now = new Date("2026-11-02T10:00:00Z");
  it("formats hours and minutes", () => {
    expect(timeLeft("2026-11-02T19:30:00Z", now)).toBe("9h 30m");
    expect(timeLeft("2026-11-02T10:45:00Z", now)).toBe("45m");
  });
  it("is null once passed", () => {
    expect(timeLeft("2026-11-02T09:00:00Z", now)).toBeNull();
    expect(timeLeft(null, now)).toBeNull();
  });
});
