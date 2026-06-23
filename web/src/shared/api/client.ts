/**
 * Generic HTTP client for the telemetry API.
 *
 * - Base URL comes from the environment (`VITE_API_URL`); empty ⇒ relative requests,
 *   which the MSW mock intercepts in dev/test.
 * - Every request is scoped to an organization (BR-ORG-02) via a header.
 * - HTTP errors are normalized into a single `ApiError` type, handled in one place.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const ORG_ID = import.meta.env.VITE_ORG_ID ?? "org-demo";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "X-Org-Id": ORG_ID,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `GET ${path} failed (${response.status})`,
    );
  }

  return (await response.json()) as T;
}
