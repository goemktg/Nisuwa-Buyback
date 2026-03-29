# Nisuwa-Buyback Project Document (Replit Operational Source)

This file is the single source of project-specific details for Replit-based operation.

For shared rules, refer to the following files:

- .github/copilot-instructions.md (global coding and quality policies)
- documents/AGENT_MANUAL.md (operational procedures and safety rules)
- AGENTS.md (agent and skill catalog)

## Overview

- Project name: Nisuwa-Buyback
- One-line description: A web app that calculates alliance buyback prices from EVE Online item lists using market prices and category-based rates
- Scope (included): API server (pricing/parsing/rate calculation), frontend (input/results/shareable URL), OpenAPI and type code generation, shared workspace type/DB libraries
- Scope (excluded): trade execution automation, payment processing, user account/authorization system

---

## Current Status

- Phase: Development
- Progress: 75%
- Status summary: Core API/frontend features are operational, and monorepo typecheck/build pipelines are configured
- Last updated: 2026-03-28

---

## Project-Specific Decisions

### Architecture and Technology Choices

- pnpm workspace + TypeScript project references: selected to keep type consistency across packages and separate build/verification concerns
- Express 5 + React (Vite): selected for a lightweight API layer and fast frontend development/deployment cycle
- OpenAPI + Orval + Zod: selected to manage a single API contract and keep frontend/backend types synchronized
- Replit plugins (@replit/vite-plugin-*): selected to maintain frontend development and debugging compatibility in Replit runtime

### Project-Specific Exception Rules

- The practical source of truth for project details is this file (replit.md), not documents/PROJECT.md
- Template-style generic explanations are minimized; only repository-grounded facts are kept

---

## Execution Commands (Project-Specific)

```bash
# Install dependencies
pnpm install

# Run full typecheck
pnpm run typecheck

# Run full build
pnpm run build

# Run API server in development mode
pnpm --filter @workspace/api-server run dev

# Run frontend in development mode
pnpm --filter @workspace/buyback run dev

# Generate OpenAPI-based client/schema code
pnpm --filter @workspace/api-spec run codegen
```

---

## Directory Map (Project-Specific)

```text
.
├── artifacts/
│   ├── api-server/            # Express API server
│   │   └── src/
│   │       ├── routes/        # health, appraise, buyback
│   │       └── lib/           # ESI/Fuzzwork integration, parser, cache, rates
│   └── buyback/               # React + Vite frontend
│       └── src/
│           ├── pages/         # Home, AppraisalResult
│           ├── components/    # UI components
│           └── lib/           # Frontend utilities
├── lib/
│   ├── api-spec/              # OpenAPI spec + Orval codegen config
│   ├── api-zod/               # OpenAPI-based Zod types/schemas
│   ├── api-client-react/      # OpenAPI-based React Query hooks
├── scripts/                   # Automation scripts (including upgrade)
├── documents/                 # Project documents (including summary doc)
├── replit.md                  # Replit operational project detail document
└── package.json               # Root scripts (typecheck/build)
```

---

## Key Work Items

1. Strengthen parser and edge-case tests for the appraise route
2. Review buyback rate management approach (static constants -> configurable data)
3. Improve result page usability (filter/sort/large-input performance)

---

## Risks and Mitigations

| Risk | Impact | Mitigation Plan |
| ------ | ------ | ------ |
| External pricing API (ESI/Fuzzwork) latency/failure | Appraisal results become slow or fail | Keep TTL cache, improve error messaging, evaluate retry policy |
| Rate rule order dependency causes misclassification | Incorrect pricing for certain items | Document rule ordering policy and add regression tests |
| Generated artifacts diverge from API spec | Frontend/backend type mismatch | Enforce codegen + typecheck whenever API spec changes |

---

## References (Project-Specific)

- README.md
- documents/PROJECT.md
- lib/api-spec/openapi.yaml
- artifacts/api-server/src/routes/appraise.ts
- artifacts/api-server/src/lib/buyback-rates.ts
