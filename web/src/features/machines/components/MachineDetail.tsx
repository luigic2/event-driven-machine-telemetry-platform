import { useMachineDetail } from "../hooks/useMachineDetail";
import { AnomalyList } from "./AnomalyList";
import { MachineStateBadge } from "./MachineStateBadge";
import { SensorReadingList } from "./SensorReadingList";

export function MachineDetail({ machineId }: { machineId: string | null }) {
  const { status, data, error } = useMachineDetail(machineId);

  if (status === "idle") {
    return (
      <p className="panel__state">Select a machine to see its telemetry.</p>
    );
  }

  if (status === "loading") {
    return (
      <p className="panel__state" role="status" aria-live="polite">
        Loading telemetry…
      </p>
    );
  }

  if (status === "error" || data === null) {
    return (
      <p className="panel__state panel__state--error" role="alert">
        Could not load this machine{error ? `: ${error.message}` : ""}.
      </p>
    );
  }

  const { machine, readings, anomalies } = data;

  return (
    <article className="machine-detail">
      <header className="machine-detail__head">
        <div>
          <h2 className="panel__title">{machine.model}</h2>
          <p className="machine-detail__sub">{machine.serialNumber}</p>
        </div>
        <MachineStateBadge state={machine.activityState} />
      </header>

      <section aria-label="Latest readings">
        <h3 className="machine-detail__section">Latest readings</h3>
        <SensorReadingList readings={readings} anomalies={anomalies} />
      </section>

      <section aria-label="Anomalies">
        <h3 className="machine-detail__section">Anomalies</h3>
        <AnomalyList anomalies={anomalies} />
      </section>
    </article>
  );
}
