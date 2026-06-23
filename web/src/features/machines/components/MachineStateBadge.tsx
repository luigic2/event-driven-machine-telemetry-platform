import { machineStateMeta } from "../lib/machineState";
import type { MachineActivityState } from "../types";

/** Colored chip for a machine's activity state. Label conveys state (not color alone). */
export function MachineStateBadge({ state }: { state: MachineActivityState }) {
  const { label, tone } = machineStateMeta(state);
  return (
    <span className={`badge badge--state-${tone}`}>
      <span className="badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
