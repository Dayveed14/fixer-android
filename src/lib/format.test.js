import { dayKey, formatTime, naira, telHref } from "./format";

describe("dayKey — the Abuja calendar day of an API date", () => {
  it.each([
    ["2026-10-23", "2026-10-23"], // plain DATE string
    ["2026-10-23T00:00:00.000Z", "2026-10-23"], // server running in UTC
    ["2026-10-22T23:00:00.000Z", "2026-10-23"], // server running in Lagos time
    ["2026-10-23T22:59:00.000Z", "2026-10-23"], // 11:59 pm in Abuja
    ["2026-10-23T23:00:00.000Z", "2026-10-24"], // midnight in Abuja
  ])("%s → %s", (value, expected) => expect(dayKey(value)).toBe(expected));

  it("is empty for missing or junk values", () => {
    expect(dayKey(null)).toBe("");
    expect(dayKey("not a date")).toBe("");
  });
});

describe("display helpers", () => {
  it("formats money, times and phone links", () => {
    expect(naira(26500)).toBe("₦26,500");
    expect(formatTime("14:30:00")).toBe("2:30 pm");
    expect(formatTime("00:05")).toBe("12:05 am");
    expect(telHref("0803 123 4567")).toBe("tel:08031234567");
  });
});
