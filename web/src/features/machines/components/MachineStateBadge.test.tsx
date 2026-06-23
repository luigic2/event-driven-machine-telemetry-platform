import { render, screen } from "@testing-library/react";
import { MachineStateBadge } from "./MachineStateBadge";

describe("MachineStateBadge", () => {
  it.each([
    ["ATIVA", "Active", "active"],
    ["OCIOSA", "Idle", "idle"],
    ["OFFLINE", "Offline", "offline"],
  ] as const)("renders %s as '%s' with tone %s", (state, label, tone) => {
    const { container } = render(<MachineStateBadge state={state} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(
      container.querySelector(`.badge--state-${tone}`),
    ).toBeInTheDocument();
  });
});
