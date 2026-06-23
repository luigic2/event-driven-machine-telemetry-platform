import type { SensorType } from "../types";

/** Canonical units per sensor type (§2.3, Apêndice A). */
const UNIT: Record<SensorType, string> = {
  engine_temp: "°C",
  engine_rpm: "rpm",
  oil_pressure: "bar",
  hydraulic_pressure: "bar",
  fuel_level: "%",
  def_level: "%",
  battery_voltage: "V",
  speed: "km/h",
  operating_hours: "h",
};

/** Human-readable sensor labels for the UI. */
const LABEL: Record<SensorType, string> = {
  engine_temp: "Engine temperature",
  engine_rpm: "Engine speed",
  oil_pressure: "Oil pressure",
  hydraulic_pressure: "Hydraulic pressure",
  fuel_level: "Fuel level",
  def_level: "DEF level",
  battery_voltage: "Battery voltage",
  speed: "Travel speed",
  operating_hours: "Operating hours",
};

export function sensorUnit(type: SensorType): string {
  return UNIT[type];
}

export function sensorLabel(type: SensorType): string {
  return LABEL[type];
}

/** Formats a numeric reading with its canonical unit, e.g. `110 °C`, `15 %`. */
export function formatReading(type: SensorType, value: number): string {
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${rounded} ${UNIT[type]}`;
}

/**
 * Formats a UTC ISO timestamp for display in a given timezone.
 * Timezone handling is the presentation layer's responsibility (§2.3).
 */
export function formatTimestamp(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(iso));
}

/** Coarse "time ago" label relative to `now` (injectable for testability). */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const minutes = Math.floor(
    (now.getTime() - new Date(iso).getTime()) / 60_000,
  );
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}
