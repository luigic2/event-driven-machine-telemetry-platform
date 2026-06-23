import { relativeTime } from "../lib/format";
import type { Machine, MachineType } from "../types";
import { MachineStateBadge } from "./MachineStateBadge";

const TYPE_LABEL: Record<MachineType, string> = {
  tractor: "Tractor",
  harvester: "Harvester",
  sprayer: "Sprayer",
  planter: "Planter",
};

interface Props {
  machine: Machine;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function MachineCard({ machine, selected, onSelect }: Props) {
  return (
    <li>
      <button
        type="button"
        className={`machine-card${selected ? " machine-card--selected" : ""}`}
        aria-pressed={selected}
        onClick={() => onSelect(machine.id)}
      >
        <span className="machine-card__head">
          <span className="machine-card__model">{machine.model}</span>
          <MachineStateBadge state={machine.activityState} />
        </span>
        <span className="machine-card__meta">
          {TYPE_LABEL[machine.type]} · {machine.serialNumber}
        </span>
        <span className="machine-card__meta">
          {machine.lastReadingAt
            ? `Last reading ${relativeTime(machine.lastReadingAt)}`
            : "No readings yet"}
        </span>
      </button>
    </li>
  );
}
