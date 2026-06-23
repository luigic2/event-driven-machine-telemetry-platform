import { severityMeta } from "../lib/severity";
import type { Severity } from "../types";

/** Icon + label so severity is never communicated by color alone (accessibility). */
const ICON: Record<Severity, string> = {
  INFO: "ℹ",
  WARNING: "▲",
  CRITICAL: "⛔",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { label, tone } = severityMeta(severity);
  return (
    <span className={`badge badge--sev-${tone}`}>
      <span aria-hidden="true">{ICON[severity]}</span>
      {label}
    </span>
  );
}
