import { describe, it, expect } from "vitest";
import { diagnosisKind, formatEstimatedRepair, noMatchMessage } from "./diagnosis";

describe("diagnosisKind", () => {
  it.each([
    [{ source: "knowledge_base", results: [{ id: 1 }] }, "knowledge_base"],
    [{ source: "knowledge_base", results: [] }, "no_match"],
    [{ source: "ai", likelyProblem: "Bad battery" }, "ai"],
    [{ source: "ai" }, "no_match"], // malformed AI payload
    [{ source: "no_match", message: "x" }, "no_match"],
    [{ success: false, message: "boom" }, "no_match"],
    [null, "no_match"],
  ])("%j -> %s", (data, kind) => {
    expect(diagnosisKind(data)).toBe(kind);
  });
});

describe("formatEstimatedRepair", () => {
  it.each([
    ["₦8,000", "₦8,000"],
    ["NGN 15,000 - 20,000", "NGN 15,000 - 20,000"],
    ["$50", "₦80,000"],
    ["50 - 100 USD", "₦80,000 – ₦160,000"],
    ["Depends on parts", "Depends on parts"],
    ["", "Assessment required"],
    [undefined, "Assessment required"],
  ])("%s -> %s", (input, output) => {
    expect(formatEstimatedRepair(input)).toBe(output);
  });
});

it("noMatchMessage falls back to a helpful default", () => {
  expect(noMatchMessage({ message: "Server says hi" })).toBe("Server says hi");
  expect(noMatchMessage({})).toMatch(/technician/);
});
