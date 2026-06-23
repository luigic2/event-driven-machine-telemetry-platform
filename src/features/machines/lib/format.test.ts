import { describe, it, expect } from "vitest";
import {
  formatReading,
  formatTimestamp,
  relativeTime,
  sensorLabel,
  sensorUnit,
} from "./format";

describe("formatReading", () => {
  it("attaches the canonical unit per sensor type (§2.3)", () => {
    expect(formatReading("engine_temp", 110)).toBe("110 °C");
    expect(formatReading("fuel_level", 15)).toBe("15 %");
    expect(formatReading("battery_voltage", 12)).toBe("12 V");
    expect(formatReading("engine_rpm", 2600)).toBe("2600 rpm");
    expect(formatReading("speed", 8)).toBe("8 km/h");
  });

  it("keeps integers clean and rounds fractionals to one decimal", () => {
    expect(formatReading("oil_pressure", 3)).toBe("3 bar");
    expect(formatReading("oil_pressure", 3.456)).toBe("3.5 bar");
  });
});

describe("sensor metadata", () => {
  it("exposes unit and label for a sensor type", () => {
    expect(sensorUnit("hydraulic_pressure")).toBe("bar");
    expect(sensorLabel("def_level")).toBe("DEF level");
  });
});

describe("formatTimestamp", () => {
  it("renders a UTC instant in the requested timezone (§2.3)", () => {
    const iso = "2026-06-19T12:00:00Z";
    const utc = formatTimestamp(iso, "UTC");
    const saoPaulo = formatTimestamp(iso, "America/Sao_Paulo"); // UTC-3

    expect(utc).toContain("12:00");
    expect(saoPaulo).toContain("09:00");
    expect(utc).not.toEqual(saoPaulo);
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-06-19T12:00:00Z");

  it("labels recent instants", () => {
    expect(relativeTime("2026-06-19T11:59:30Z", now)).toBe("just now");
    expect(relativeTime("2026-06-19T11:45:00Z", now)).toBe("15 min ago");
  });

  it("rolls up into hours and days", () => {
    expect(relativeTime("2026-06-19T09:00:00Z", now)).toBe("3 h ago");
    expect(relativeTime("2026-06-17T12:00:00Z", now)).toBe("2 d ago");
  });
});
