import { render, screen } from "@testing-library/react";
import { SensorReadingList } from "./SensorReadingList";
import type { Anomaly, SensorReading } from "../types";

const reading = (
  sensorType: SensorReading["sensorType"],
  value: number,
): SensorReading => ({
  machineId: "m-1",
  sensorType,
  value,
  recordedAt: "2026-06-19T12:00:00Z",
});
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

describe("SensorReadingList", () => {
  it("shows 'no recent readings' message when there are no readings", () => {
    render(<SensorReadingList readings={[]} anomalies={[]} />);
    expect(screen.getByText(/no recent readings/i)).toBeInTheDocument();
  });

  it("renders a reading without a badge when nothing flags it", () => {
    render(
      <SensorReadingList
        readings={[reading("engine_temp", 92)]}
        anomalies={[]}
      />,
    );
    expect(screen.getByText("92 °C")).toBeInTheDocument();
    expect(screen.queryByText("Warning")).not.toBeInTheDocument();
  });
  it("flags the reader when a matching anomaly is present", () => {
    render(
      <SensorReadingList
        readings={[reading("engine_temp", 125)]}
        anomalies={[anomaly("engine_temp", "CRITICAL")]}
      />,
    );
    expect(screen.getByText("125 °C")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("it ignores an anomaly whose sensor is not among the readings", () => {
    render(
      <SensorReadingList
        readings={[reading("engine_temp", 125)]}
        anomalies={[anomaly("battery_voltage", "CRITICAL")]}
      />,
    );
    expect(screen.getByText("125 °C")).toBeInTheDocument();
    expect(screen.queryByText("Critical")).not.toBeInTheDocument();
  });
});
