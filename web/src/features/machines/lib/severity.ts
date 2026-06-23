import type { Severity, Anomaly } from "../types";

/** Numeric rank for ordering: INFO < WARNING < CRITICAL (BR-ANO-03). */
const ORDER: Record<Severity, number> = {
  INFO: 0,
  WARNING: 1,
  CRITICAL: 2,
};

export interface SeverityMeta {
  label: string;
  /** Design token / CSS modifier key. */
  tone: "info" | "warning" | "critical";
  order: number;
}

const META: Record<Severity, SeverityMeta> = {
  INFO: { label: "Info", tone: "info", order: ORDER.INFO },
  WARNING: { label: "Warning", tone: "warning", order: ORDER.WARNING },
  CRITICAL: { label: "Critical", tone: "critical", order: ORDER.CRITICAL },
};

export function severityMeta(severity: Severity): SeverityMeta {
  return META[severity];
}

/** Comparator for sorting (ascending). Negative if `a` is less severe. */
export function compareSeverity(a: Severity, b: Severity): number {
  return ORDER[a] - ORDER[b];
}

/** The most severe level among anomalies, or `null` when there are none. */
export function highestSeverity(
  anomalies: readonly Anomaly[],
): Severity | null {
  if (anomalies.length === 0) return null;
  return anomalies.reduce<Severity>(
    (worst, current) =>
      ORDER[current.severity] > ORDER[worst] ? current.severity : worst,
    "INFO",
  );
}
