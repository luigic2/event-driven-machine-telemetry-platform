import { describe, it, expect } from "vitest";
import { deriveActivityState, machineStateMeta } from "./machineState";

describe("deriveActivityState (BR-EST)", () => {
  const now = new Date("2026-06-19T12:00:00Z");
  const minutesAgo = (m: number) =>
    new Date(now.getTime() - m * 60_000).toISOString();

  it("is OFFLINE when the machine has never reported", () => {
    expect(deriveActivityState(null, now)).toBe("OFFLINE");
  });

  it("is ATIVA within the 15-minute activity window (BR-EST-01)", () => {
    expect(deriveActivityState(minutesAgo(2), now)).toBe("ATIVA");
    expect(deriveActivityState(minutesAgo(15), now)).toBe("ATIVA"); // boundary
  });

  it("is OCIOSA after 15 min and before 2 h (BR-EST-02)", () => {
    expect(deriveActivityState(minutesAgo(16), now)).toBe("OCIOSA");
    expect(deriveActivityState(minutesAgo(119), now)).toBe("OCIOSA");
  });

  it("is OFFLINE at or beyond 2 h (BR-EST-03)", () => {
    expect(deriveActivityState(minutesAgo(120), now)).toBe("OFFLINE");
    expect(deriveActivityState(minutesAgo(300), now)).toBe("OFFLINE");
  });
});

describe("machineStateMeta", () => {
  it("maps each state to a tone and label", () => {
    expect(machineStateMeta("ATIVA")).toEqual({
      label: "Active",
      tone: "active",
    });
    expect(machineStateMeta("OFFLINE").tone).toBe("offline");
  });
});
