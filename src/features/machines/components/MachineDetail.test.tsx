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
  it("shows an idle hint when no machine is selected", () => {
    // machineId = null → idle state, no request is made, no mock needed.
    render(<MachineDetail machineId={null} />);
    expect(screen.getByText(/select a machine/i)).toBeInTheDocument();
  });

  it("renders the machine and its readings from the (default) mock", async () => {
    render(<MachineDetail machineId="m-x9" />);

    // Loading shows first, synchronously.
    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);

    // Then the data from the fixtures appears.
    expect(await screen.findByText("John Deere 8R 410")).toBeInTheDocument();
    expect(screen.getByText("12 %")).toBeInTheDocument(); // fuel_level formatted

    // "Warning" shows up twice (flagged reading badge + anomaly entry), so use
    // getAllByText — getByText throws when a query matches more than one node.
    expect(screen.getAllByText("Warning").length).toBeGreaterThanOrEqual(1);
  });

  it("shows an error when the API fails (overridden mock)", async () => {
    // Override just this endpoint to fail, for this test only.
    server.use(
      http.get("/machines/:id", () => new HttpResponse(null, { status: 500 })),
    );

    render(<MachineDetail machineId="m-x9" />);

    expect(
      await screen.findByText(/could not load this machine/i),
    ).toBeInTheDocument();
  });

  it("shows 'no open anomalies' when the mock returns an empty list", async () => {
    // Override only the anomalies endpoint to return [].
    server.use(
      http.get("/machines/:id/anomalies", () => HttpResponse.json([])),
    );

    render(<MachineDetail machineId="m-x9" />);

    expect(await screen.findByText(/no open anomalies/i)).toBeInTheDocument();
  });
});
