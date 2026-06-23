# CLAUDE.md

> Operating manual for AI agents and contributors working in the **AgriTelemetry** repository.
> Read this file fully before touching code. The authoritative domain spec is
> [`docs/AgriTelemetry-Regras-de-Negocio.md`](docs/AgriTelemetry-Regras-de-Negocio.md) —
> when a change touches domain behavior, cite the relevant rule (e.g. `BR-IDE-02`).

---

## 1. Project overview

AgriTelemetry is a backend service that **ingests, processes, stores, and serves telemetry from a fleet of connected agricultural machines** (tractors, harvesters, sprayers). Connected machines emit sensor readings — engine temperature, fuel level, hydraulic pressure, GPS, operating hours, fault codes — and the system makes that data reliable, queryable, and useful for fleet health monitoring and early problem detection.

**Guiding principle:** in agriculture, machine downtime inside a planting or harvest window is catastrophic — it can mean lost crop. Therefore this system prioritizes, in order: **ingestion reliability → data integrity → early anomaly detection** above everything else. Optimize for those; never trade them away for convenience.

---

## 2. Architecture

```
[Machines / simulator]
        │  POST /readings  (validate + enqueue only)
        ▼
   [Ingestion API] ──enqueue──▶ [Queue: SQS] ──▶ [Worker]
        │ 202 Accepted                                │ dedup (idempotency)
        │                                             │ apply business rules
        ▼                                             │ persist
   (no DB write here)                                 ▼
                                            [Postgres] ◀── reads ──▶ [Read API]
                                            [Redis] (hot state: latest reading/machine)
                                            [DLQ] (poison messages)
```

**Why this shape:** the queue decouples ingestion from processing, which buys load-leveling under burst, failure isolation, and independent scaling. This is a **modular monolith**, not microservices — that was a deliberate decision (see Rule 2). The seams (queue, `event_id`, ingestion/worker split) are placed so that a service could be extracted later _if_ a concrete pain appears.

---

## 3. Non-negotiable invariants

These are load-bearing. Never violate them, never "simplify" them away. Each maps to a business rule.

1. **Ingestion responds `202 Accepted` and only enqueues.** No synchronous DB write, no business logic at the edge. (`BR-ING-06`)
2. **Delivery is at-least-once → processing MUST be idempotent.** Dedup key is `event_id`, backed by a `UNIQUE` constraint on the primary store. (`BR-IDE-02`)
3. **The idempotency check is strongly consistent** — primary store only, never a read replica or cache. (`BR-IDE-03`)
4. **A message is acked/deleted only AFTER successful persistence.** (`BR-PRC-02`)
5. **Persisted readings are immutable.** Corrections are new rows; telemetry is an append-only log. (`BR-IDE-04`)
6. **Corrupted data ≠ anomaly.** Physically impossible values are rejected at ingestion (`BR-ING-03`); possible-but-dangerous values are accepted and flagged (`BR-ANO-01`). Never conflate them — the anomaly is the data we exist to capture.
7. **Reads are eventually consistent.** Freshly ingested data may not appear until processed. This is expected behavior, not a bug. (`BR-DAT-04`)
8. **Every read query is scoped to the owning organization.** A missing org filter is a critical security defect. (`BR-ORG-02`)
9. **No accepted reading is ever dropped silently.** On failure it is retained (queue or DLQ) until resolved. (`BR-PRC-05`)

If a task would require breaking one of these, **stop and surface it** (Rule 7). The invariant wins.

---

## 4. Tech stack

- **Runtime:** Node 20 + TypeScript (strict mode)
- **HTTP:** Fastify
- **Data:** PostgreSQL (primary), Redis (hot-state cache)
- **Messaging:** AWS SQS — emulated locally with LocalStack
- **Validation:** Zod (at the ingestion boundary)
- **Logging:** pino (structured)
- **Containers:** Docker + docker-compose
- **CI/CD:** GitHub Actions (OIDC to assume AWS roles — no long-lived keys in the repo)
- **Tests:** Vitest + Testing-library Packages + Testcontainers + Playwright (E2E)
- **Stretch:** Terraform (IaC), OpenTelemetry (distributed tracing)

---

## 5. Repository structure (intended)

```
src/
  api/          # Fastify routes — ingestion + read endpoints (thin)
  services/     # business logic (anomaly eval, state derivation) — pure where possible
  repositories/ # data access (SQL); the only layer that talks to Postgres
  worker/       # SQS consumer: dedup → rules → persist
  queue/        # SQS client wrappers (send/receive/delete)
  config/       # env loading, no secrets in code
  domain/       # types, schemas (Zod), thresholds
tests/
  unit/  integration/  e2e/
docs/
  AgriTelemetry-Regras-de-Negocio.md   # authoritative domain spec
  adr/                                  # architecture decision records
infra/          # Terraform (stretch)
docker-compose.yml
```

Keep routes thin, business logic in `services/`, all SQL in `repositories/`. Do not let SQL leak into routes.

---

## 6. Commands

> Scripts are the single source of truth for how to run things. Update this list when scripts change.

```
npm run dev          # run the API locally
npm run worker       # run the worker locally
npm run test:unit    # fast, no I/O
npm run test:int     # integration (spins Postgres + LocalStack via Testcontainers)
npm run test:e2e     # full stack via docker-compose
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
docker compose up    # api + worker + postgres + redis + localstack
```

---

## 7. Conventions

- **TypeScript strict**; no `any` without a written reason.
- **Validate at the boundary** (Zod), trust internally. Validation rules come from `BR-ING-*`.
- **Centralized error handling** in the API; never let an unhandled rejection crash a request silently.
- **Config from environment only**; secrets live in a secrets store, never in code or versioned config (`BR-SEG-03`).
- **Structured logging** (pino) with correlation ids; a reading should be traceable from ingestion to persistence (`BR-OBS-04`).
- **Connection pooling** for Postgres; never open a connection per request.
- **Async/await** throughout; never block the event loop (Rule 11).

---

## 8. Testing strategy

Follow the pyramid: many unit, fewer integration, few E2E. Test **behavior, not implementation**. Coverage is a guide, not a target.

- **Unit** — pure functions, no I/O: anomaly evaluation (`BR-ANO-05`), machine-state derivation (`BR-EST`), operating-hours monotonicity (`BR-MAN-02`), input validation (`BR-ING-03/04/05`).
- **Integration** — real dependencies via Testcontainers + LocalStack: referential integrity (`BR-MAQ-03`), idempotency (`BR-IDE-02/03`), ack-after-persist (`BR-PRC-02`).
- **E2E** — full stack: the ingestion → processing → query path. Because it crosses the async boundary, **E2E assertions MUST poll with a timeout** until the data appears (`BR-DAT-04`) — never assert synchronously right after the 202.

**Signature tests** (these alone prove the distributed-systems understanding — keep them green):

- Send the **same `event_id` twice** → assert exactly **one** row exists. (idempotency)
- Send a **poison message** → assert it lands in the **DLQ** without blocking the queue.

---

## 9. The 12-rule operating loop

These rules apply to every task. Use them as an iterative loop, not strict sequential steps. Each is augmented with how it applies **in this project**.

### Phase 1 — Planning

**Rule 1 — Think Before Coding**
State assumptions explicitly. Ask rather than guess. Push back when a simpler approach exists. Stop when you are confused.
_In this project:_ before writing domain code, identify the governing `BR-` rule and the invariant(s) in §3 it touches. If a change would break an invariant, stop and confirm before proceeding.

**Rule 2 — Simplicity First**
Write the minimum code that solves the problem. Do nothing speculative. Do not build abstractions for single-use code.
_In this project:_ we deliberately chose a modular monolith over microservices, and Postgres over a specialized time-series store, because the scope does not justify the cost. Do not add services, queues, caches, frameworks, or abstractions the current scope doesn't require. "Could scale later" is not a reason to build it now.

**Rule 3 — Surgical Changes**
Touch only what you must. Do not improve adjacent code. Match the existing style exactly. Do not refactor what isn't broken.
_In this project:_ keep the layer boundaries (api / services / repositories / worker) intact; don't move logic across them opportunistically.

### Phase 2 — Execution

**Rule 4 — Goal-Driven Execution**
Define success criteria upfront. Loop until verified. Strong success criteria let the agent loop independently.
_In this project:_ for domain work, the success criterion is "the test that encodes the relevant `BR-` rule passes." Write or identify that test first.

**Rule 5 — Judgment Over Guesswork**
Use the model primarily for judgment calls (classification, summarization, extraction). If existing code or libraries can answer the question, do not invent custom logic.
_In this project:_ prefer the platform's guarantees over hand-rolled logic — a `UNIQUE` constraint for dedup, the AWS SDK v3 for SQS, `pg`/Drizzle for queries, Zod for validation. Do not reimplement what SQS or Postgres already guarantee.

**Rule 6 — Token Budget Discipline**
Token budgets are strict boundaries. If a complex task approaches limits, summarize progress and ask for permission to start a fresh context rather than silently overflowing.

**Rule 7 — Conflict Resolution**
If two patterns contradict, pick one (e.g., the more recent or tested) and explain why. Surface the conflict instead of averaging them out.
_In this project:_ if a convenient fix conflicts with a §3 invariant, the invariant wins — surface the conflict, never quietly weaken the invariant to make a task pass.

**Rule 8 — Read Before You Write**
Before adding code, read the module exports, immediate callers, and shared utilities to prevent duplicating efforts or breaking imports.
_In this project:_ read the relevant `repositories/` and `services/` modules and the `BR-` rule before adding domain code.

### Phase 3 — Testing & Reporting

**Rule 9 — Trust, But Verify**
Write strong assertions. Just because a function returns without error does not mean it works correctly. Ensure side-effects and critical paths are explicitly tested.
_In this project:_ a `202` from the ingestion API does **not** mean the reading was persisted — persistence is async. Assert the side effect (the row exists, with the right anomaly flag) **after** the worker runs, using eventual-consistency polling.

**Rule 10 — Step-by-Step Recovery**
When a multi-step refactor fails midway, halt. Do not complete steps 5 and 6 on top of a broken state from step 4. Report the failure immediately.

**Rule 11 — Native Style Adherence**
Respect language idioms. Do not introduce patterns from one ecosystem into another (e.g., no React hooks in standard JS class components).
_In this project:_ this is a plain Node/Fastify service — do not carry Next.js framework assumptions (API routes, SSR lifecycles) into it. Use Node/TS idioms; never block the event loop with sync I/O.

**Rule 12 — Fail Loudly**
"Completed" is unacceptable if anything was skipped silently. "Tests pass" is invalid if any were skipped. Default to surfacing uncertainty and skipped constraints, never hide them.
_In this project:_ never swallow a failed message — route it to the DLQ (`BR-PRC-03`). "Tests pass" is invalid if integration/E2E were skipped because LocalStack or the containers weren't running. Say what was skipped.

---

## 10. Collaboration mode (deliberate learning)

This repository is built partly as a learning vehicle. For the modules marked as **learning targets — the queue producer/consumer, the worker, and the test suites** — the AI agent should act as a **tutor, not a ghostwriter**: explain the concept, review, and debug, but let the human author the core logic. Accelerate freely on boilerplate, config, IaC, and code the human already owns (AWS wiring, Docker, CI).

The bar for "done" on a learning module: **the human can delete the file and rewrite it from scratch, explaining every decision.** If that isn't true yet, the module isn't finished.

---

## 11. References

- [`docs/AgriTelemetry-Regras-de-Negocio.md`](docs/AgriTelemetry-Regras-de-Negocio.md) — authoritative business-rules / domain spec (rule IDs cited throughout this file).
- `docs/adr/` — architecture decision records (the "why" behind each major choice).
- `README.md` — project intro, setup, and live demo links.
