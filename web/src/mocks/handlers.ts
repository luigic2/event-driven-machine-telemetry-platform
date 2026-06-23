import { http, HttpResponse } from "msw";
import {
  anomaliesByMachine,
  latestReadingsByMachine,
  machines,
} from "./fixtures";

/**
 * MSW handlers mirroring the read API contract. Paths are relative, so they
 * intercept both the jsdom test origin and the Vite dev server.
 */
export const handlers = [
  http.get("/machines", () => HttpResponse.json(machines)),

  http.get("/machines/:id", ({ params }) => {
    const machine = machines.find((m) => m.id === params.id);
    return machine
      ? HttpResponse.json(machine)
      : new HttpResponse(null, { status: 404 });
  }),

  http.get("/machines/:id/readings/latest", ({ params }) =>
    HttpResponse.json(latestReadingsByMachine[params.id as string] ?? []),
  ),

  http.get("/machines/:id/anomalies", ({ params }) =>
    HttpResponse.json(anomaliesByMachine[params.id as string] ?? []),
  ),
];
