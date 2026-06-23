import type { MachineActivityState } from "../types";

export interface MachineStateMeta {
  label: string;
  /** Design token / CSS modifier key. */
  tone: "active" | "idle" | "offline";
}

const META: Record<MachineActivityState, MachineStateMeta> = {
  ATIVA: { label: "Active", tone: "active" },
  OCIOSA: { label: "Idle", tone: "idle" },
  OFFLINE: { label: "Offline", tone: "offline" },
};

export function machineStateMeta(
  state: MachineActivityState,
): MachineStateMeta {
  return META[state];
}

/** Activity window: a machine is ATIVA if it reported within 15 min (BR-EST-01). */
export const ACTIVE_WINDOW_MS = 15 * 60 * 1000;
/** Idle ceiling: more than 2 h without a reading is OFFLINE (BR-EST-03). */
export const IDLE_CEILING_MS = 2 * 60 * 60 * 1000;

/**
 * Derives the activity state from the time since the last reading (BR-EST-01/02/03).
 *
 * NOTE: the backend is the authoritative source of machine state (BR-EST-05). This
 * helper exists only to drive a freshness indicator client-side while there is no
 * backend; once the API returns `activityState`, prefer that value.
 */
export function deriveActivityState(
  lastReadingAt: string | null,
  now: Date = new Date(),
): MachineActivityState {
  if (lastReadingAt === null) return "OFFLINE";
  const elapsed = now.getTime() - new Date(lastReadingAt).getTime();
  if (elapsed <= ACTIVE_WINDOW_MS) return "ATIVA";
  if (elapsed < IDLE_CEILING_MS) return "OCIOSA";
  return "OFFLINE";
}
