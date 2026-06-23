import { describe, it, expect } from "vitest";
import { compareSeverity, highestSeverity, severityMeta } from "./severity";
import type { Anomaly, Severity } from "../types";

function anomaly(severity: Severity): Anomaly {
  return {
    id: `a-${severity}`,
    machineId: "m-1",
    sensorType: "engine_temp",
    value: 125,
    severity,
    detectedAt: "2026-06-19T12:00:00Z",
  };
}

describe("compareSeverity", () => {
  it("orders INFO < WARNING < CRITICAL (BR-ANO-03)", () => {
    expect(compareSeverity("INFO", "WARNING")).toBeLessThan(0);
    expect(compareSeverity("CRITICAL", "WARNING")).toBeGreaterThan(0);
    expect(compareSeverity("WARNING", "WARNING")).toBe(0);
  });

  it("sorts a list ascending by severity", () => {
    const sorted = (["CRITICAL", "INFO", "WARNING"] as Severity[]).sort(
      compareSeverity,
    );
    expect(sorted).toEqual(["INFO", "WARNING", "CRITICAL"]);
  });
});

describe("highestSeverity", () => {
  it("returns null when there are no anomalies", () => {
    expect(highestSeverity([])).toBeNull();
  });

  it("picks the most severe present", () => {
    expect(highestSeverity([anomaly("INFO"), anomaly("CRITICAL")])).toBe(
      "CRITICAL",
    );
    expect(highestSeverity([anomaly("INFO"), anomaly("WARNING")])).toBe(
      "WARNING",
    );
  });
});

describe("severityMeta", () => {
  it("maps each severity to a tone and label", () => {
    expect(severityMeta("CRITICAL")).toMatchObject({
      tone: "critical",
      label: "Critical",
    });
    expect(severityMeta("INFO").order).toBeLessThan(
      severityMeta("WARNING").order,
    );
  });
});
