# Reflection — AI-Assisted Development

## What I Learned Using AI Agents

Working with AI agents on a domain-heavy project like FuelEU compliance surfaced a clear lesson: **AI excels at structure, not domain knowledge**. When given precise, constrained prompts ("implement greedy allocation for pool CB balancing"), agents produced solid code. When given vague prompts, they hallucinated domain details or picked wrong formulas.

The hexagonal architecture turned out to be an excellent fit for AI-assisted development. Because the core domain is entirely free of framework dependencies, I could prompt agents to generate use-cases in isolation — no need to provide context about Express, Vite, or React. This dramatically reduced prompt complexity and improved output quality.

I also learned that **TypeScript strict mode is your best collaborator** when working with AI. The compiler caught every silent error in agent-generated code — implicit `any`s, missing `await`s, wrong return types — turning what could have been runtime bugs into immediate, fixable build errors.

## Efficiency Gains vs Manual Coding

| Task | Manual Estimate | With AI | Saving |
|------|-----------------|---------|--------|
| 4× In-memory repository adapters | ~2 hours | ~20 min | 83% |
| 6× HTTP route handlers | ~1.5 hours | ~25 min | 72% |
| Unit + integration test suite | ~3 hours | ~45 min | 75% |
| React component boilerplate | ~2 hours | ~30 min | 75% |
| Tailwind styling passes | ~1.5 hours | ~20 min | 78% |
| **Total estimated** | **~10 hours** | **~2.5 hours** | **~75%** |

The biggest gains were in **mechanical translation** tasks: "here's an interface, implement it with in-memory storage." The smallest gains were in **domain logic**: the pooling algorithm required careful manual verification regardless of how well the agent wrote the surrounding code.

## Improvements I'd Make Next Time

**1. Start with a `tasks.md`** — Before prompting, write a decomposition of all work items. Agents perform significantly better when given a single, bounded task versus a multi-part request.

**2. Prompt for tests first** — Generating the test cases before the implementation (TDD with AI) catches edge cases that the agent would otherwise silently skip in the implementation. The `ApplyBanked` over-apply bug was only caught because I had a test that asked "what if amount > banked?".

**3. Use a schema contract as the prompt anchor** — Instead of describing entities in prose, paste the TypeScript interface directly into the prompt. Agents are dramatically more accurate when working from a concrete type definition than from a natural-language description.

**4. Add a Postgres adapter pass** — The in-memory adapters are clean and testable, but a second prompt pass to generate Prisma/pg-based implementations (implementing the same port interfaces) would make the system production-ready with minimal additional code.

**5. Automate the architecture guard** — Add an ESLint rule or a simple `grep` CI check to enforce that nothing in `src/core/` imports from `src/adapters/` or any framework package. This constraint was maintained manually here; automating it would make the hexagonal boundary self-enforcing.
