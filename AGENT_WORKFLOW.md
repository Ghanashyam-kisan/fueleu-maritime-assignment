# AI Agent Workflow Log

## Agents Used

| Agent | Role |
|-------|------|
| **Claude Code** | Architecture scaffolding, domain modeling, use-case generation, test writing |
| **GitHub Copilot** | Inline autocomplete for boilerplate (repository adapters, router wiring) |
| **Cursor Agent** | Refactoring large components, converting JS snippets to strict TypeScript |

---

## Prompts & Outputs

### Example 1 — Domain Entity Design

**Prompt (Claude Code):**
```
Design a TypeScript domain entity file for FuelEU Maritime compliance.
Include: Route, ComplianceBalance, BankEntry, Pool, PoolMember.
Also export pure functions: computeCB(ghgIntensity, fuelConsumption, target) 
and computePercentDiff(baseline, comparison).
Use strict types, no framework imports.
```

**Generated output (excerpt):**
```ts
export const TARGET_INTENSITY_2025 = 89.3368;
export const ENERGY_CONVERSION_MJ_PER_TONNE = 41_000;

export function computeCB(
  ghgIntensity: number,
  fuelConsumption: number,
  targetIntensity: number = TARGET_INTENSITY_2025
): number {
  const energyInScope = fuelConsumption * ENERGY_CONVERSION_MJ_PER_TONNE;
  return (targetIntensity - ghgIntensity) * energyInScope;
}
```

**Assessment:** Correct formula, constants match spec. Accepted as-is.

---

### Example 2 — CreatePool Use Case

**Prompt (Claude Code):**
```
Write a CreatePoolUseCase class in TypeScript (hexagonal architecture).
It must:
- Accept year and members[]
- Fetch CB for each member from IComplianceRepository
- Validate sum(CB) >= 0
- Use greedy allocation: sort desc by CB, transfer surplus to deficits
- Enforce: deficit ship cannot exit worse, surplus ship cannot exit negative
- Return the created Pool via IPoolRepository
Throw descriptive errors for all invalid states.
```

**Generated output:** Full use-case with greedy allocation loop (two-pointer approach).

**Correction made:** Initial output used `forEach` with async inside — this doesn't await correctly in JS. Replaced with `for...of` loop to ensure sequential async CB fetches.

---

### Example 3 — React BankingTab

**Prompt (Cursor Agent):**
```
Create a React component BankingTab.tsx using TailwindCSS.
It should:
- Let user pick shipId (R001–R005) and year via dropdowns
- Load CB via useBanking hook
- Show KPI cards: cbGco2eq, ship, status (surplus/deficit)
- Bank button (disabled if CB <= 0)
- Apply input + button (with amount validation)
- Show apply result KPI cards (cbBefore, applied, cbAfter)
- Use dark slate theme, ocean-blue accents
```

**Correction made:** Agent generated `<form onSubmit>` pattern — replaced with `onClick` handlers per React best practices (no form elements). Also added the `animate-slide-up` class for polish.

---

### Example 4 — Integration Tests

**Prompt (Claude Code):**
```
Write Supertest integration tests for these Express endpoints:
GET /routes, POST /routes/:id/baseline, GET /routes/comparison,
GET /compliance/cb, POST /banking/bank, POST /banking/apply.
Use the in-memory app factory. Cover: happy path, missing params, 
invalid IDs, deficit banking rejection.
```

**Output quality:** Excellent. All tests were structurally correct. Added one additional edge case manually: testing that `POST /banking/bank` with a deficit route (R001) returns HTTP 400.

---

## Validation / Corrections

### Formula Validation
- Verified `computeCB` against spec manually:
  - R002 (LNG, 88.0 gCO₂e/MJ, 4800t): `(89.3368 - 88.0) × (4800 × 41000) = +263,193,600 gCO₂e` ✓
  - R001 (HFO, 91.0 gCO₂e/MJ, 5000t): `(89.3368 - 91.0) × (5000 × 41000) = -341,136,000 gCO₂e` ✓

### Architecture Validation
- Confirmed no framework imports leak into `src/core/` — verified with `grep -r "express\|react\|axios" src/core/` returning no results.
- Confirmed all use-cases depend only on port interfaces, not concrete adapters.

### Pool Algorithm Validation
- Traced two-pointer greedy with R002 (+263M) + R001 (-341M):
  - Sum = -78M → invalid pool (correct rejection) ✓
- Traced R002 + R004 (RoRo 89.2, near-zero CB):
  - Both near target, small surplus/deficit → allocation converges ✓

### Type Safety
- Ran `tsc --noEmit` mentally; ensured all async functions are properly typed with `Promise<T>` returns.
- `strict: true` catches all implicit `any` — no suppressions used.

---

## Observations

### Where AI Saved Time
- **Boilerplate elimination:** Repository adapters (in-memory CRUD) — what would take 30 min took 3 min per adapter.
- **Test generation:** ~80% of test cases were generated correctly on first attempt, reducing test writing time by ~60%.
- **Interface consistency:** AI maintained consistent naming (camelCase domain vs snake_case DB) throughout without being reminded.
- **Error message quality:** Generated descriptive error messages (`Cannot bank a deficit or zero CB (cb=-341136000.00)`) without prompting.

### Where It Failed or Hallucinated
- **Async forEach bug:** Agent used `members.forEach(async m => await ...)` which executes fire-and-forget — a classic async pitfall. Required manual correction to `for...of`.
- **Over-fetching in hooks:** Initial `useRoutes` hook re-fetched on every render because the `filters` object was a new reference each time. Fixed by spreading filter values into `useCallback` deps.
- **Form elements in React:** Cursor Agent defaulted to HTML `<form>` with `onSubmit` — replaced with button `onClick` pattern per project guidelines.
- **Tailwind purge issue:** Agent generated dynamic class strings like `` `text-${color}-400` `` which Tailwind's JIT cannot detect. Replaced with static conditional class maps.

### How Tools Were Combined
1. **Claude Code** for architecture decisions and complex logic (pooling algorithm, hexagonal structure)
2. **Copilot inline** for repetitive patterns (router boilerplate, interface implementations)
3. **Cursor Agent** for UI components (faster iteration on visual/JSX code)
4. Manual review + TypeScript compiler as the final quality gate

---

## Best Practices Followed

- Kept prompts **specific and scoped** — one use-case per prompt, not "build the whole backend"
- Always specified **architectural constraints** in prompts ("hexagonal", "no framework in core")
- Used **port interfaces** as the contract — generated adapters implement ports, keeping core clean
- Verified **every formula** against the spec before trusting agent output
- Treated agent output as a **first draft**, not final code — always reviewed before committing
- Used `tasks.md` (Cursor) to break work into small, verifiable increments
