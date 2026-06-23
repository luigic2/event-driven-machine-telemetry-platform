import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MachineDetail } from "./MachineDetail";
import { server } from "../../../mocks/server";

/**
 * HOW MOCKING WORKS HERE
 * ----------------------
 * The MSW server is already started for the whole test run in `src/test/setup.ts`.
 * So for the happy path you mock NOTHING: the handlers in `src/mocks/handlers.ts`
 * answer `/machines/:id`, `/readings/latest` and `/anomalies` with the fixtures.
 *
 * To test a *specific* scenario (error, empty, custom data) you OVERRIDE a handler
 * for that one test with `server.use(...)`. The override is reset after each test
 * (`afterEach(server.resetHandlers())` in setup), so tests stay isolated.
 *
 * Two more rules:
 *  - Don't call the hook (`useMachineDetail`) yourself — it runs inside the
 *    component. Assert on what the user sees (the rendered DOM).
 *  - Use `findBy*` (async) for anything that appears after the fetch resolves.
 */
describe("MachineDetail", () => {
  it("shows idle message when no machine is selected", () => {
    render(<MachineDetail machineId={null} />);
    expect(screen.getByText(/select a machine/i)).toBeInTheDocument();
  });

  it("shows error message when request fails", async () => {
    server.use(
      http.get("/machines/:id", () => new HttpResponse(null, { status: 500 })),
    );
    render(<MachineDetail machineId={"m-x9"} />);

    expect(
      await screen.findByText(/Could not load this machine/i),
    ).toBeInTheDocument();
  });

  it("shows 'no open anomalies' when mock returns empty list", async () => {
    server.use(
      http.get("/machines/:id/anomalies", () => HttpResponse.json([])),
    );
    render(<MachineDetail machineId={"m-x9"} />);
    expect(await screen.findByText(/no open anomalies/i)).toBeInTheDocument();
  });

  it("shows 'no recent readings' when the mock returns an empty list", async () => {
    server.use(
      http.get("/machines/:id/readings/latest", () => HttpResponse.json([])),
    );

    render(<MachineDetail machineId="m-x9" />);

    expect(await screen.findByText(/No recent readings/i)).toBeInTheDocument();
  });

  it("Renders the machine and its reading from the mock", async () => {
    render(<MachineDetail machineId="m-x9" />);
    expect(screen.getByText(/loading telemetry/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
    expect(await screen.findByText("John Deere 8R 410")).toBeInTheDocument();
    expect(await screen.findByText("12 %")).toBeInTheDocument();
    expect(await screen.findAllByText("Warning")).toHaveLength(2);
  });
});
