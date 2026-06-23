import { render, screen } from "@testing-library/react";
import { AnomalyList } from "./AnomalyList";
import type { Anomaly } from "../types";

const anomaly = (
  sensorType: Anomaly["sensorType"],
  severity: Anomaly["severity"],
): Anomaly => ({
  id: `an-${sensorType}`,
  machineId: "m-1",
  sensorType,
  value: 0,
  severity,
  detectedAt: "2026-06-19T12:00:00Z",
});

describe("AnomalyList", () => {
  it("shows 'no anomalies detected' message when no anomalies are present", () => {
    render(<AnomalyList anomalies={[]} />);
    expect(screen.getByText(/No open anomalies/i)).toBeInTheDocument();
  });

  it("lists the most severe anomaly first", () => {
    render(
      <AnomalyList
        anomalies={[
          anomaly("engine_temp", "WARNING"),
          anomaly("engine_temp", "CRITICAL"),
        ]}
      />,
    );
    const elementA = screen.getByText("Critical");
    const elementB = screen.getByText("Warning");
    expect(elementA.compareDocumentPosition(elementB)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
  it("flags the anomaly when severity is present", () => {
    render(<AnomalyList anomalies={[anomaly("engine_temp", "CRITICAL")]} />);
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });
});
