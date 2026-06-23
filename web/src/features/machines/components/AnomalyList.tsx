import { formatReading, formatTimestamp, sensorLabel } from "../lib/format";
import { compareSeverity } from "../lib/severity";
import type { Anomaly } from "../types";
import { SeverityBadge } from "./SeverityBadge";

export function AnomalyList({ anomalies }: { anomalies: Anomaly[] }) {
  if (anomalies.length === 0) {
    return <p className="panel__state">No open anomalies. 🌱</p>;
  }

  // Most severe first (BR-ALR: critical conditions need attention first).
  const sorted = [...anomalies].sort((a, b) =>
    compareSeverity(b.severity, a.severity),
  );

  return (
    <ul className="anomaly-list">
      {sorted.map((anomaly) => (
        <li key={anomaly.id} className="anomaly">
          <SeverityBadge severity={anomaly.severity} />
          <span className="anomaly__text">
            {sensorLabel(anomaly.sensorType)} —{" "}
            {formatReading(anomaly.sensorType, anomaly.value)}
          </span>
          <span className="anomaly__time">
            {formatTimestamp(anomaly.detectedAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
