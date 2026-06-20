import { formatReading, formatTimestamp, sensorLabel } from "../lib/format";
import type { Anomaly, SensorReading } from "../types";
import { SeverityBadge } from "./SeverityBadge";

interface Props {
  readings: SensorReading[];
  anomalies: Anomaly[];
}

export function SensorReadingList({ readings, anomalies }: Props) {
  if (readings.length === 0) {
    return <p className="panel__state">No recent readings.</p>;
  }

  const severityBySensor = new Map(
    anomalies.map((anomaly) => [anomaly.sensorType, anomaly.severity]),
  );

  return (
    <ul className="reading-list">
      {readings.map((reading) => {
        const severity = severityBySensor.get(reading.sensorType);
        return (
          <li
            key={reading.sensorType}
            className={`reading${severity ? " reading--flagged" : ""}`}
          >
            <span className="reading__label">
              {sensorLabel(reading.sensorType)}
            </span>
            <span className="reading__value">
              {formatReading(reading.sensorType, reading.value)}
            </span>
            <span className="reading__time">
              {formatTimestamp(reading.recordedAt)}
            </span>
            {severity && <SeverityBadge severity={severity} />}
          </li>
        );
      })}
    </ul>
  );
}
