# FuelEU Maritime — Compliance Dashboard

A full-stack implementation of the **FuelEU Maritime compliance module** (Regulation EU 2023/1805), covering route management, GHG intensity comparison, surplus banking (Art. 20), and vessel pooling (Art. 21).

---

## Architecture Summary

Both backend and frontend follow **Hexagonal Architecture** (Ports & Adapters / Clean Architecture):

```
core/
  domain/        ← Pure entities, types, and domain formulas (no framework)
  application/   ← Use-cases (orchestrate domain + port interfaces)
  ports/         ← Repository/service interfaces (the boundary)

adapters/
  inbound/       ← HTTP handlers (Express) — implements inbound ports
  outbound/      ← Repositories (in-memory / Postgres) — implements outbound ports
  ui/            ← React components + hooks — implements UI inbound ports
  infrastructure/← API clients (Axios) — implements outbound ports

infrastructure/
  server/        ← Express app wiring and server entry point
```

**Key principle:** `core/` has zero dependencies on any framework. Use-cases depend only on port interfaces, not concrete adapters. This enables swapping the in-memory repositories for Postgres adapters without touching any business logic.

---

## Project Structure

```
fueleu/
├── backend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── domain/entities.ts          # Route, CB, BankEntry, Pool + formulas
│   │   │   ├── application/use-cases/      # GetRoutes, SetBaseline, ComputeCB, etc.
│   │   │   └── ports/repositories.ts       # IRouteRepository, IBankingRepository, etc.
│   │   ├── adapters/
│   │   │   ├── inbound/http/routes/        # Express route handlers
│   │   │   └── outbound/postgres/          # In-memory repository implementations
│   │   ├── infrastructure/server/index.ts  # Server entry point
│   │   └── __tests__/                      # Unit + integration tests
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── core/
│   │   │   ├── domain/types.ts             # Shared TypeScript types
│   │   │   └── ports/services.ts           # IRouteService, IBankingService, etc.
│   │   ├── adapters/
│   │   │   ├── infrastructure/apiService.ts # Axios implementations of service ports
│   │   │   └── ui/
│   │   │       ├── components/             # RoutesTab, CompareTab, BankingTab, PoolingTab
│   │   │       └── hooks/                  # useRoutes, useComparison, useBanking, usePooling
│   │   ├── App.tsx                         # Tab navigation shell
│   │   └── main.tsx                        # React entry point
│   ├── package.json
│   └── vite.config.ts
│
├── AGENT_WORKFLOW.md
├── REFLECTION.md
└── README.md
```

---

## Setup & Run

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Backend

```bash
cd backend
npm install
npm run dev        # starts on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # starts on http://localhost:3000
```

The Vite dev server proxies all API calls (`/routes`, `/compliance`, `/banking`, `/pools`) to `http://localhost:4000`, so no CORS configuration is needed during development.

---

## Running Tests

### Backend

```bash
cd backend
npm test
```

Runs both unit tests (domain formulas, use-cases) and integration tests (HTTP endpoints via Supertest).

### Frontend

```bash
cd frontend
npm test
```

Runs component tests and domain formula tests via Vitest + Testing Library.

---

## API Reference

### Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/routes` | List all routes. Query: `vesselType`, `fuelType`, `year` |
| `POST` | `/routes/:id/baseline` | Set a route as the baseline |
| `GET` | `/routes/comparison` | Compare all non-baseline routes against baseline |

### Compliance

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/compliance/cb?shipId=&year=` | Compute & store Compliance Balance |
| `GET` | `/compliance/adjusted-cb?shipId=&year=` | CB + banked surplus |

### Banking (Art. 20)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/banking/records?shipId=&year=` | — | List bank entries |
| `POST` | `/banking/bank` | `{ shipId, year }` | Bank positive CB |
| `POST` | `/banking/apply` | `{ shipId, year, amount }` | Apply banked to deficit |

### Pooling (Art. 21)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/pools` | `{ year, members: [{shipId}] }` | Create compliance pool |
| `GET` | `/pools/:id` | — | Retrieve pool by ID |

---

## Core Formulas

```
Energy in scope (MJ)  = fuelConsumption (t) × 41,000 MJ/t
Compliance Balance    = (Target - Actual GHG) × Energy in scope
  Positive CB → Surplus
  Negative CB → Deficit

Target Intensity (2025) = 89.3368 gCO₂e/MJ  (2% below 91.16)

Percent Difference = ((comparison / baseline) - 1) × 100
```

---

## Sample API Requests

```bash
# Get all routes
curl http://localhost:4000/routes

# Set R002 as baseline
curl -X POST http://localhost:4000/routes/R002/baseline

# Compare routes
curl http://localhost:4000/routes/comparison

# Compute CB for R002 in 2024
curl "http://localhost:4000/compliance/cb?shipId=R002&year=2024"

# Bank surplus for R002
curl -X POST http://localhost:4000/banking/bank \
  -H "Content-Type: application/json" \
  -d '{"shipId":"R002","year":2024}'

# Apply 100,000 gCO2e from bank
curl -X POST http://localhost:4000/banking/apply \
  -H "Content-Type: application/json" \
  -d '{"shipId":"R002","year":2024,"amount":100000}'

# Create a pool (first compute CB for both ships)
curl -X POST http://localhost:4000/pools \
  -H "Content-Type: application/json" \
  -d '{"year":2024,"members":[{"shipId":"R002"},{"shipId":"R001"}]}'
```

---

## Seed Data

| Route | Vessel | Fuel | Year | GHG (gCO₂e/MJ) | CB Status |
|-------|--------|------|------|-----------------|-----------|
| R001 | Container | HFO | 2024 | 91.0 | ❌ Deficit |
| R002 | BulkCarrier | LNG | 2024 | 88.0 | ✅ Surplus |
| R003 | Tanker | MGO | 2024 | 93.5 | ❌ Deficit |
| R004 | RoRo | HFO | 2025 | 89.2 | ✅ Surplus (marginal) |
| R005 | Container | LNG | 2025 | 90.5 | ❌ Deficit |

R001 is the default baseline. Use the Routes tab or `POST /routes/:id/baseline` to change it.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend framework | React 18 + TypeScript |
| Frontend styling | TailwindCSS 3 |
| Frontend charts | Recharts |
| Frontend build | Vite 5 |
| Frontend tests | Vitest + Testing Library |
| Backend framework | Express 4 + TypeScript |
| Backend tests | Jest + Supertest |
| Architecture | Hexagonal (Ports & Adapters) |
| Storage | In-memory (swap-ready for Postgres) |
