import type {
  Anomaly,
  Machine,
  SensorReading,
} from "../features/machines/types";

/**
 * Demo fixtures for the MSW mock. Timestamps are relative to load time so the
 * fleet shows a realistic mix of activity states (BR-EST) and severities (BR-ANO).
 * Anomaly values are chosen against the thresholds in Apêndice A.
 */

const minutesAgo = (m: number) =>
  new Date(Date.now() - m * 60_000).toISOString();
const ORG = "org-demo";

export const machines: Machine[] = [
  {
    id: "m-x9",
    type: "tractor",
    model: "John Deere 8R 410",
    serialNumber: "BR-8R-0001",
    orgId: ORG,
    activityState: "ATIVA",
    lifecycleState: "ATIVA_EM_CAMPO",
    lastReadingAt: minutesAgo(2),
  },
  {
    id: "m-s780",
    type: "harvester",
    model: "John Deere S780",
    serialNumber: "BR-S7-0002",
    orgId: ORG,
    activityState: "OCIOSA",
    lifecycleState: "ATIVA_EM_CAMPO",
    lastReadingAt: minutesAgo(42),
  },
  {
    id: "m-r4",
    type: "sprayer",
    model: "John Deere R4040",
    serialNumber: "BR-R4-0003",
    orgId: ORG,
    activityState: "OFFLINE",
    lifecycleState: "ATIVA_EM_CAMPO",
    lastReadingAt: minutesAgo(190),
  },
  {
    id: "m-1775",
    type: "planter",
    model: "John Deere 1775NT",
    serialNumber: "BR-17-0004",
    orgId: ORG,
    activityState: "ATIVA",
    lifecycleState: "EM_MANUTENCAO",
    lastReadingAt: minutesAgo(6),
  },
];

export const latestReadingsByMachine: Record<string, SensorReading[]> = {
  "m-x9": [
    reading("m-x9", "engine_temp", 92, 2),
    reading("m-x9", "engine_rpm", 2100, 2),
    reading("m-x9", "fuel_level", 12, 2), // WARNING (< 15%)
    reading("m-x9", "battery_voltage", 13.4, 2),
    reading("m-x9", "operating_hours", 1840, 2),
  ],
  "m-s780": [
    reading("m-s780", "engine_temp", 125, 42), // CRITICAL (> 120 °C)
    reading("m-s780", "oil_pressure", 2.1, 42),
    reading("m-s780", "def_level", 35, 42),
    reading("m-s780", "operating_hours", 5120, 42),
  ],
  "m-r4": [
    reading("m-r4", "engine_temp", 70, 190),
    reading("m-r4", "fuel_level", 64, 190),
    reading("m-r4", "battery_voltage", 11.6, 190), // WARNING (< 11.8 V)
  ],
  "m-1775": [
    reading("m-1775", "engine_temp", 88, 6),
    reading("m-1775", "hydraulic_pressure", 210, 6),
    reading("m-1775", "operating_hours", 980, 6),
  ],
};

export const anomaliesByMachine: Record<string, Anomaly[]> = {
  "m-x9": [anomaly("m-x9", "fuel_level", 12, "WARNING", 2)],
  "m-s780": [
    anomaly("m-s780", "engine_temp", 125, "CRITICAL", 42),
    anomaly("m-s780", "oil_pressure", 2.1, "INFO", 90),
  ],
  "m-r4": [anomaly("m-r4", "battery_voltage", 11.6, "WARNING", 190)],
  "m-1775": [],
};

function reading(
  machineId: string,
  sensorType: SensorReading["sensorType"],
  value: number,
  ageMinutes: number,
): SensorReading {
  return { machineId, sensorType, value, recordedAt: minutesAgo(ageMinutes) };
}

function anomaly(
  machineId: string,
  sensorType: Anomaly["sensorType"],
  value: number,
  severity: Anomaly["severity"],
  ageMinutes: number,
): Anomaly {
  return {
    id: `${machineId}-${sensorType}-${ageMinutes}`,
    machineId,
    sensorType,
    value,
    severity,
    detectedAt: minutesAgo(ageMinutes),
  };
}
