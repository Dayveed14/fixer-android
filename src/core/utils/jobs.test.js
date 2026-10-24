import { describe, it, expect } from "vitest";
import { buildJobs, whatsappNumber } from "./jobs";

describe("buildJobs", () => {
  it("merges appointments, repairs and tickets, skipping tickets that belong to a booking", () => {
    const jobs = buildJobs({
      appointments: [{ id: 1, booking_reference: "#BK1", support_type: "video", status: "confirmed", ticket_id: 30 }],
      repairs: [{ id: 3, reference: "FXR-1003", status: "repair", repair_outcome: null }],
      tickets: [
        { id: 30, ticket_code: "#TK30", status: "Open" },
        { id: 31, ticket_code: "#TK31", status: "Open" },
      ],
    });
    expect(jobs.map((j) => j.reference)).toEqual(["#BK1", "FXR-1003", "#TK31"]);
    expect(jobs[0].title).toBe("Video call");
  });

  it("puts work still to do first", () => {
    const jobs = buildJobs({
      appointments: [
        { id: 1, booking_reference: "#BK1", status: "completed" },
        { id: 2, booking_reference: "#BK2", status: "confirmed" },
      ],
    });
    expect(jobs.map((j) => j.state)).toEqual(["active", "done"]);
  });

  it("a repair the technician has reported is done for them", () => {
    const [job] = buildJobs({ repairs: [{ id: 3, status: "repair", repair_outcome: "repaired" }] });
    expect(job.state).toBe("done");
    expect(job.statusLabel).toMatch(/with admin/);
  });
});

describe("whatsappNumber", () => {
  it.each([
    ["0803 123 4567", "2348031234567"],
    ["+234 803 123 4567", "2348031234567"],
    ["", null],
    ["123", null],
  ])("%s -> %s", (input, out) => {
    expect(whatsappNumber(input)).toBe(out);
  });
});
