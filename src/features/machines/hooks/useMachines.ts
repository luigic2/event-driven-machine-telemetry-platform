import { useEffect, useState } from "react";
import { getMachines } from "../api";
import type { Machine } from "../types";

export type AsyncStatus = "loading" | "error" | "empty" | "success";

export interface UseMachinesResult {
  status: AsyncStatus;
  machines: Machine[];
  error: Error | null;
}

/** Loads the fleet, exposing explicit loading / error / empty / success states. */
export function useMachines(): UseMachinesResult {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [status, setStatus] = useState<AsyncStatus>("loading");
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    getMachines()
      .then((data) => {
        if (!active) return;
        setMachines(data);
        setStatus(data.length === 0 ? "empty" : "success");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error ? err : new Error("Failed to load machines"),
        );
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  return { status, machines, error };
}
