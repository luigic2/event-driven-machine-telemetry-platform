/**
 * WORKED EXAMPLE (authored by Claude as a reference for the hybrid testing split).
 *
 * This shows the pattern for component tests against the MSW mock: render →
 * assert the loading state → `findBy*` for the async result → assert interaction.
 * Luigi authors the remaining component tests (MachineDetail, badges, lists) the
 * same way — see the case list shared in chat.
 */
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import MachineList from "./MachineList";

describe("MachineList (example)", () => {
  it("shows a loading state, then renders the fleet from the API", async () => {
    render(<MachineList selectedId={null} onSelect={() => {}} />);

    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);

    expect(await screen.findByText("John Deere 8R 410")).toBeInTheDocument();
    expect(screen.getByText("John Deere S780")).toBeInTheDocument();
  });

  it("calls onSelect with the machine id when a card is clicked", async () => {
    const onSelect = vi.fn();
    render(<MachineList selectedId={null} onSelect={onSelect} />);

    fireEvent.click(await screen.findByRole("button", { name: /8R 410/i }));

    expect(onSelect).toHaveBeenCalledWith("m-x9");
  });
});
