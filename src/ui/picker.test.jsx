import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useState } from "react";
import { PickerField } from "./index";
import { parentPath } from "../core/nav";

const ZONES = [
  { value: "wuse", label: "Wuse (Zones 1–7)", meta: "₦1,500", group: "City centre" },
  { value: "garki", label: "Garki (Areas 1–11)", meta: "₦2,000", group: "City centre" },
  { value: "gwarinpa", label: "Gwarinpa", meta: "₦3,500", group: "Inner districts" },
];

function Harness() {
  const [zone, setZone] = useState("");
  return (
    <MemoryRouter>
      <PickerField label="Area in Abuja" searchable value={zone} onChange={setZone} options={ZONES} placeholder="Choose your area" />
      <output>{zone}</output>
    </MemoryRouter>
  );
}

describe("PickerField (bottom-sheet select)", () => {
  it("opens a sheet grouped by district with fees, and picks an area", () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText("Area in Abuja"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Inner districts")).toBeInTheDocument();
    expect(screen.getByText("₦3,500")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /Garki/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Area in Abuja")).toHaveTextContent("Garki (Areas 1–11)");
  });

  it("filters with search", () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText("Area in Abuja"));
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "gwa" } });
    expect(screen.getAllByRole("radio")).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "zzz" } });
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
  });
});

describe("parentPath (back when there's no history)", () => {
  it.each([
    ["/c/repairs/12", "/c/repairs"],
    ["/a/content/articles/new", "/a/content/articles"],
    ["/c/book", "/c"],
    ["/c", "/"],
  ])("%s → %s", (from, to) => expect(parentPath(from)).toBe(to));
});
