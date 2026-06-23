import { render, screen } from "@testing-library/react";
import { SeverityBadge } from "./SeverityBadge";

describe("SeverityBadge", () => {
  it("shows the equivalent label and tone", () => {
    const { container } = render(<SeverityBadge severity={"INFO"} />);
    expect(screen.getByText("Info")).toBeInTheDocument();
    const tone = container.querySelector('[class$="-info"]');
    expect(tone).toBeInTheDocument();
  });
});
