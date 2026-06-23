import { useEffect, useState } from "react";
import { getAnomalies, getLatestReadings, getMachine } from "../api";
import type { Anomaly, Machine, SensorReading } from "../types";
import type { AsyncStatus } from "./useMachines";

export interface MachineDetailData {
  machine: Machine;
  readings: SensorReading[];
  anomalies: Anomaly[];
}

export interface UseMachineDetailResult {
  status: AsyncStatus | "idle";
  data: MachineDetailData | null;
  error: Error | null;
}

/** Loads a machine's hot state (latest readings + anomalies). Idle when no id. */
export function useMachineDetail(
  machineId: string | null,
): UseMachineDetailResult {
  const [data, setData] = useState<MachineDetailData | null>(null);
  const [status, setStatus] = useState<AsyncStatus | "idle">("idle");
  const [error, setError] = useState<Error | null>(null);
  // Starts as null (nothing tracked yet) so a component mounted directly with a
  // machineId still transitions through the loading state on its first render.
  const [trackedId, setTrackedId] = useState<string | null>(null);

  // Reset synchronously when the selected machine changes, during render —
  // the React-recommended alternative to resetting state inside an effect.
  if (trackedId !== machineId) {
    setTrackedId(machineId);
    setStatus(machineId === null ? "idle" : "loading");
    setData(null);
    setError(null);
  }

  useEffect(() => {
    if (machineId === null) return;

    let active = true;

    Promise.all([
      getMachine(machineId),
      getLatestReadings(machineId),
      getAnomalies(machineId),
    ])
      .then(([machine, readings, anomalies]) => {
        if (!active) return;
        setData({ machine, readings, anomalies });
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error ? err : new Error("Failed to load machine"),
        );
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [machineId]);

  return { status, data, error };
}
