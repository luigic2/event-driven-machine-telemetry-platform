/**
 * Domain types for the machines feature.
 *
 * These mirror the authoritative spec in `docs/AgriTelemetry-Regras-de-Negocio.md`.
 * The frontend is a read/demo client: it *displays* this data, it does not own the
 * business rules (e.g. machine state is derived server-side — BR-EST-05).
 */

/** Anomaly severity, ordered INFO < WARNING < CRITICAL (BR-ANO-03, §2.3). */
export type Severity = "INFO" | "WARNING" | "CRITICAL";

/** Activity state derived from time since last reading (BR-EST). */
export type MachineActivityState = "ATIVA" | "OCIOSA" | "OFFLINE";

/** Lifecycle state of the asset (BR-MAQ-04). */
export type MachineLifecycleState =
  | "ATIVA_EM_CAMPO"
  | "EM_MANUTENCAO"
  | "DESATIVADA";

/** Supported sensor types (Apêndice A). */
export type SensorType =
  | "engine_temp"
  | "engine_rpm"
  | "oil_pressure"
  | "hydraulic_pressure"
  | "fuel_level"
  | "def_level"
  | "battery_voltage"
  | "speed"
  | "operating_hours";

export type MachineType = "tractor" | "harvester" | "sprayer" | "planter";

export interface SensorReading {
  machineId: string;
  sensorType: SensorType;
  value: number;
  /** ISO 8601, UTC (§2.3). Timezone is the presentation layer's job. */
  recordedAt: string;
}

export interface Anomaly {
  id: string;
  machineId: string;
  sensorType: SensorType;
  value: number;
  severity: Severity;
  /** ISO 8601, UTC. */
  detectedAt: string;
}

export interface Machine {
  id: string;
  type: MachineType;
  model: string;
  serialNumber: string;
  /** Owning organization — every read is scoped to it (BR-ORG-02). */
  orgId: string;
  activityState: MachineActivityState;
  lifecycleState: MachineLifecycleState;
  /** ISO 8601, UTC; `null` if the machine has never reported. */
  lastReadingAt: string | null;
}
