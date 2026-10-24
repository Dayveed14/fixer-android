import { describe, it, expect } from "vitest";
import {
  allSlots,
  availableSlots,
  isDateBookable,
  firstBookableDate,
  formatSlot,
  nowInBusinessTz,
} from "./schedule";

const at = (iso) => new Date(iso); // Abuja = UTC+1

describe("schedule (frontend)", () => {
  it("offers 8:00 AM to 9:30 PM for calls and up to 9:00 PM for pickups", () => {
    expect(allSlots("booking")[0]).toBe("08:00");
    expect(allSlots("booking").at(-1)).toBe("21:30");
    expect(allSlots("pickup").at(-1)).toBe("21:00");
  });

  it("at 9 PM, today has nothing left and tomorrow is fully open", () => {
    const now = at("2026-11-02T20:00:00Z");
    expect(availableSlots("2026-11-02", "booking", now)).toEqual([]);
    expect(isDateBookable("2026-11-02", "booking", now)).toBe(false);
    expect(availableSlots("2026-11-03", "booking", now)).toEqual(allSlots("booking"));
    expect(firstBookableDate("booking", now)).toBe("2026-11-03");
  });

  it("hides slots inside the notice period today", () => {
    const now = at("2026-11-02T13:10:00Z"); // 2:10 PM Abuja
    expect(availableSlots("2026-11-02", "booking", now)[0]).toBe("15:30");
    expect(availableSlots("2026-11-02", "pickup", now)[0]).toBe("16:30");
  });

  it("uses Abuja time even if the device clock is in another zone", () => {
    expect(nowInBusinessTz(at("2026-11-01T23:30:00Z")).date).toBe("2026-11-02");
  });

  it("blocks past dates and dates more than 30 days ahead", () => {
    const now = at("2026-11-02T08:00:00Z");
    expect(isDateBookable("2026-11-01", "booking", now)).toBe(false);
    expect(isDateBookable("2026-12-03", "booking", now)).toBe(false);
  });

  it.each([
    ["08:00", "8:00 AM"],
    ["12:30", "12:30 PM"],
    ["21:30", "9:30 PM"],
  ])("formats %s as %s", (slot, label) => {
    expect(formatSlot(slot)).toBe(label);
  });
});
