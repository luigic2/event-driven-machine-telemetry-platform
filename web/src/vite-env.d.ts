/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the telemetry API. Empty string ⇒ relative (MSW-mocked in dev). */
  readonly VITE_API_URL?: string;
  /** Organization the client is scoped to (BR-ORG-02). */
  readonly VITE_ORG_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
