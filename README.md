# FuelEU Maritime — Compliance Dashboard

A **full-stack implementation of the FuelEU Maritime compliance module** (Regulation EU 2023/1805), covering:

* Route management
* GHG intensity comparison
* Surplus banking (**Article 20**)
* Vessel pooling (**Article 21**)

This project was developed as part of a **full-stack engineering assignment** and demonstrates:

* **Hexagonal Architecture (Ports & Adapters)**
* Clean domain modeling
* Separation of business logic from frameworks
* AI-assisted development workflows

---

# Architecture Overview

Both the **backend** and **frontend** follow **Hexagonal Architecture (Clean Architecture)**.

```
                  ┌─────────────────────┐
                  │      React UI       │
                  │  (Routes / Compare) │
                  └──────────┬──────────┘
                             │
                             ▼
                 ┌─────────────────────┐
                 │   HTTP Controllers  │
                 │    (Express API)    │
                 └──────────┬──────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │    Use Cases    │
                   │ Application Lyr │
                   └────────┬────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │     Domain      │
                   │  Entities +     │
                   │   Formulas      │
                   └────────┬────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │ Repository Interfaces   │
              │       (Ports)           │
              └──────────┬──────────────┘
                         │
                         ▼
           ┌─────────────────────────────┐
           │ Infrastructure Adapters     │
           │  InMemory / Postgres Repo   │
           └─────────────────────────────┘
```

### Key Principle

The **core domain layer has zero framework dependencies**.

Use cases depend only on **port interfaces**, enabling infrastructure components (database, APIs, UI) to be swapped without modifying domain logic.

---

# Project Structure

```
fueleu/
├── backend/
│
│   ├── src/
│   │   ├── core/
│   │   │
│   │   │   ├── domain/
│   │   │   │   └── entities.ts
│   │   │
│   │   │   ├── application/
│   │   │   │   └── use-cases/
│   │   │   │       ├── GetRoutes.ts
│   │   │   │       ├── SetBaseline.ts
│   │   │   │       ├── ComputeCB.ts
│   │   │   │       ├── ComputeComparison.ts
│   │   │   │       ├── BankSurplus.ts
│   │   │   │       ├── ApplyBanked.ts
│   │   │   │       └── CreatePool.ts
│   │   │
│   │   │   └── ports/
│   │   │       └── repositories.ts
│   │
│   │   ├── adapters/
│   │   │   ├── inbound/http/
│   │   │   │   └── routes/
│   │   │   └── outbound/postgres/
│   │
│   │   ├── infrastructure/
│   │   │   └── server/index.ts
│   │
│   │   └── __tests__/
│
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│
│   ├── src/
│   │
│   │   ├── core/
│   │   │   ├── domain/types.ts
│   │   │   └── ports/services.ts
│   │
│   │   ├── adapters/
│   │   │   ├── infrastructure/apiService.ts
│   │   │   └── ui/
│   │   │       ├── components/
│   │   │       │   ├── RoutesTab.tsx
│   │   │       │   ├── CompareTab.tsx
│   │   │       │   ├── BankingTab.tsx
│   │   │       │   └── PoolingTab.tsx
│   │   │       │
│   │   │       └── hooks/
│   │   │           ├── useRoutes.ts
│   │   │           ├── useComparison.ts
│   │   │           ├── useBanking.ts
│   │   │           └── usePooling.ts
│   │
│   │   ├── App.tsx
│   │   └── main.tsx
│
│   ├── package.json
│   └── vite.config.ts
│
├── AGENT_WORKFLOW.md
├── REFLECTION.md
└── README.md
```

---

# Setup & Run

## Prerequisites

* Node.js **≥ 18**
* npm **≥ 9**

---

# Backend

Start the API server.

```
cd backend
npm install
npm run dev
```

Backend runs at:

```
http://localhost:4000
```

---

# Frontend

Start the dashboard.

```
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:3000
```

The Vite dev server proxies API requests to:

```
http://localhost:4000
```

So **no CORS configuration is required** during development.

---

# Running Tests

## Backend

```
cd backend
npm test
```

Includes:

* Unit tests for domain formulas
* Use-case tests
* Integration tests with Supertest

---

## Frontend

```
cd frontend
npm test
```

Runs:

* Component tests
* Hook tests
* Domain formula validation

---

# API Reference

## Routes

| Method | Endpoint               | Description                      |
| ------ | ---------------------- | -------------------------------- |
| GET    | `/routes`              | List all routes                  |
| POST   | `/routes/:id/baseline` | Set baseline route               |
| GET    | `/routes/comparison`   | Compare baseline vs other routes |

---

## Compliance

| Method | Endpoint                                | Description                |
| ------ | --------------------------------------- | -------------------------- |
| GET    | `/compliance/cb?shipId=&year=`          | Compute Compliance Balance |
| GET    | `/compliance/adjusted-cb?shipId=&year=` | CB after banking           |

---

## Banking (Article 20)

| Method | Endpoint                         | Description          |
| ------ | -------------------------------- | -------------------- |
| GET    | `/banking/records?shipId=&year=` | List bank entries    |
| POST   | `/banking/bank`                  | Bank positive CB     |
| POST   | `/banking/apply`                 | Apply banked surplus |

---

## Pooling (Article 21)

| Method | Endpoint     | Description            |
| ------ | ------------ | ---------------------- |
| POST   | `/pools`     | Create compliance pool |
| GET    | `/pools/:id` | Retrieve pool          |

---

# Core Formulas

```
Energy in scope (MJ)
= fuelConsumption (t) × 41,000 MJ/t

Compliance Balance
= (Target − Actual GHG) × Energy

Positive CB → Surplus
Negative CB → Deficit
```

### Target Intensity

```
Target (2025)
= 89.3368 gCO₂e/MJ
```

### Comparison

```
Percent Difference
= ((comparison / baseline) − 1) × 100
```

---

# Seed Dataset

| Route | Vessel      | Fuel | Year | GHG  | Result  |
| ----- | ----------- | ---- | ---- | ---- | ------- |
| R001  | Container   | HFO  | 2024 | 91.0 | Deficit |
| R002  | BulkCarrier | LNG  | 2024 | 88.0 | Surplus |
| R003  | Tanker      | MGO  | 2024 | 93.5 | Deficit |
| R004  | RoRo        | HFO  | 2025 | 89.2 | Surplus |
| R005  | Container   | LNG  | 2025 | 90.5 | Deficit |

Default baseline = **R001**

---

# Tech Stack

| Layer            | Technology                 |
| ---------------- | -------------------------- |
| Frontend         | React + TypeScript         |
| Styling          | TailwindCSS                |
| Charts           | Recharts                   |
| Build Tool       | Vite                       |
| Backend          | Node.js + Express          |
| Testing          | Jest + Supertest           |
| Frontend Testing | Vitest                     |
| Architecture     | Hexagonal                  |
| Storage          | In-Memory (Postgres ready) |

---

# AI-Agent Usage

AI tools were used for:

* Boilerplate generation
* Use-case scaffolding
* Refactoring suggestions
* Test case generation

See:

```
AGENT_WORKFLOW.md
```

for the full workflow log.

---

# Reflection

Lessons learned about **AI-assisted development** are documented in:

```
REFLECTION.md
```

---

# Reference

FuelEU Maritime Regulation:

**EU Regulation 2023/1805**

Relevant sections:

* Article 20 — Banking
* Article 21 — Pooling
* Annex IV — GHG intensity calculations
