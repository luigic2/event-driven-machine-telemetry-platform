import { it, describe, expect, afterAll } from "vitest";
import { buildApp } from "../app";

describe("GET /health", () => {
  const app = buildApp();
  afterAll(() => app.close()); // libera recursos no fim (era seu "after")

  it("returns 200 with status ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: "ok" });
  });
});
