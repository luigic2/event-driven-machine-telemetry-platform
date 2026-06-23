import { useMachines } from "../hooks/useMachines";
import { MachineCard } from "./MachineCard";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function MachineList({ selectedId, onSelect }: Props) {
  const { status, machines, error } = useMachines();

  return (
    <div className="machine-list">
      <h2 className="panel__title">Fleet</h2>

      {status === "loading" && (
        <p className="panel__state" role="status" aria-live="polite">
          Loading machines…
        </p>
      )}

      {status === "error" && (
        <p className="panel__state panel__state--error" role="alert">
          Could not load machines{error ? `: ${error.message}` : ""}.
        </p>
      )}

      {status === "empty" && (
        <p className="panel__state">No machines registered yet.</p>
      )}

      {status === "success" && (
        <ul className="machine-list__items">
          {machines.map((machine) => (
            <MachineCard
              key={machine.id}
              machine={machine}
              selected={machine.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
