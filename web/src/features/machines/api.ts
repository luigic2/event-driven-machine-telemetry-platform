import { apiGet } from "@shared/api/client";
import type { Anomaly, Machine, SensorReading } from "./types";

/** Fleet of machines for the caller's organization (BR-ORG-02, BR-DAT-01). */
export function getMachines(): Promise<Machine[]> {
  return apiGet<Machine[]>("/machines");
}

export function getMachine(machineId: string): Promise<Machine> {
  return apiGet<Machine>(`/machines/${machineId}`);
}

/** Latest reading per sensor for a machine — the "hot state" (BR-EST-04). */
export function getLatestReadings(machineId: string): Promise<SensorReading[]> {
  return apiGet<SensorReading[]>(`/machines/${machineId}/readings/latest`);
}

/** Open anomalies for a machine, for alerting and triage (BR-ALR-02). */
export function getAnomalies(machineId: string): Promise<Anomaly[]> {
  return apiGet<Anomaly[]>(`/machines/${machineId}/anomalies`);
}
