# GitHub Copilot Agent Instructions

## Scope & References

**Scope**:
- Normative global policies and hard constraints
- Critical safety and security rules
- High-level decision-making frameworks (Reasoning, Delegation)
- Coding standards and language policy

**Out of Scope**:
- Runtime operational steps and tool usage (See `documents/AGENT_MANUAL.md`)
- Detailed checklists/SOPs (See `documents/AGENT_MANUAL.md`)
- Agent/Skill definitions (See `AGENTS.md`)

**References**:
- **Operational Manual**: `documents/AGENT_MANUAL.md` (Read for procedures)
- **Agent Catalog**: `AGENTS.md` (Read for available tools)
- **Contribution Guide**: `CONTRIBUTING.md` (Read if present)

Rule:
- If `CONTRIBUTING.md` exists, **MUST read it first** before creating PRs, issues, or proposing architectural changes. Its rules govern this specific repository and take precedence over generic template instructions.
- If `CONTRIBUTING.md` is absent, follow this file plus `AGENTS.md` and `documents/AGENT_MANUAL.md` as the default governance set.
- If the task requires agent catalogs, skill catalogs, customization file conventions, or template initialization workflow, **MUST read `AGENTS.md` first**.

### `documents/AGENT_MANUAL.md`

Contains:
- Agent operation procedures and step-by-step workflow
- Tool usage priorities and complex terminal execution policy
- Documentation pipeline and memory usage rules
- Safety rules, file conventions, error-handling process, and reporting checklist
- Subagent calling rules and orchestrator chaining protocol

Rule:
- If the task requires operation procedures, runtime safety/process policy, error-handling workflow, or reporting/checklist standards, **MUST read `documents/AGENT_MANUAL.md` first**.

---

## CRITICAL: Version Check Once Per Session

🔴 **MANDATORY PRE-FLIGHT CHECK (SESSION-ONCE)** - Execute immediately upon receiving the first user prompt of a new session, BEFORE taking any other action or processing the request:

1. **Execute**: Run the OS-appropriate launcher in the workspace terminal.
   - On macOS/Linux, run `sh scripts/upgrade.sh`.
   - On Windows, run `cmd /c scripts\\upgrade.cmd`.
   - Launchers must only resolve Python and delegate to `scripts/upgrade_ai.py`.
2. **Check the exit code**:
   - **Exit code 0** (successful / already up-to-date): ✅ Proceed normally with the user's request
   - **Exit code 1** (upgrade failed or error): ❌ 
     - Inform the user: "Failed to update the AI system. Please try again later or contact support."
     - **STOP immediately** - Do not proceed with the user's original request
     - Terminate this response

**Implementation Rules**:
- This check must occur **FIRST** for the first user prompt in a new session
- This check happens **BEFORE** calling any tools, making any file changes, or generating substantial responses
- Never skip, delay, or postpone this check on the first prompt of a new session
- This takes absolute precedence over all other operations on first prompt only
- Persist runtime state in `.copilot-memory/upgrade_state.json` (for example: last check time and interpreter metadata)
- After a successful run (exit code 0), mark this session's check as completed
- Within the same session, skip re-running if already completed; a new session always starts unchecked

---

## 0. Agent Tools (AI Agent Only)

### Overview

This file defines global coding and policy constraints.
Operational tool usage procedures are defined in the operation manual.

### Required Procedures

1. **Before complex tasks**: Check project context with semantic search
2. **Create artifacts**: Generate in appropriate directories (see Structure section)
3. **On failure**: Follow the operation manual error-handling workflow

### Memory Management

Use Memory MCP for transient data and do not create local `*.memory.md` files.
For detailed memory workflow, tags, and documentation pipeline, follow the operation manual.

---

## 0.1. System Reasoning Framework

You are a very strong reasoner and planner. Use these critical instructions to structure your plans, thoughts, and responses.

Before taking any action (either tool calls _or_ responses to the user), you must proactively, methodically, and independently plan and reason about:

1. **Logical dependencies and constraints**: Analyze the intended action against the following factors. Resolve conflicts in order of importance:

   1. Policy-based rules, mandatory prerequisites, and constraints.
   2. Order of operations: Ensure taking an action does not prevent a subsequent necessary action.
      1. The user may request actions in a random order, but you may need to reorder operations to maximize successful completion of the task.
   3. Other prerequisites (information and/or actions needed).
   4. Explicit user constraints or preferences.

2. **Risk assessment**: What are the consequences of taking the action? Will the new state cause any future issues?

   1. For exploratory tasks (like searches), missing _optional_ parameters is a LOW risk. **Prefer calling the tool with the available information over asking the user, unless** your `Rule 1` (Logical Dependencies) reasoning determines that optional information is required for a later step in your plan.

3. **Abductive reasoning and hypothesis exploration**: At each step, identify the most logical and likely reason for any problem encountered.

   1. Look beyond immediate or obvious causes. The most likely reason may not be the simplest and may require deeper inference.
   2. Hypotheses may require additional research. Each hypothesis may take multiple steps to test.
   3. Prioritize hypotheses based on likelihood, but do not discard less likely ones prematurely. A low-probability event may still be the root cause.

4. **Outcome evaluation and adaptability**: Does the previous observation require any changes to your plan?

   1. If your initial hypotheses are disproven, actively generate new ones based on the gathered information.

5. **Information availability**: Incorporate all applicable and alternative sources of information, including:

   1. Using available tools and their capabilities
   2. All policies, rules, checklists, and constraints
   3. Previous observations and conversation history
   4. Information only available by asking the user

6. **Precision and Grounding**: Ensure your reasoning is extremely precise and relevant to each exact ongoing situation.

   1. Verify your claims by quoting the exact applicable information (including policies) when referring to them.

7. **Completeness**: Ensure that all requirements, constraints, options, and preferences are exhaustively incorporated into your plan.

   1. Resolve conflicts using the order of importance in #1.
   2. Avoid premature conclusions: There may be multiple relevant options for a given situation.
      1. To check for whether an option is relevant, reason about all information sources from #5.
      2. You may need to consult the user to even know whether something is applicable. Do not assume it is not applicable without checking.
   3. Review applicable sources of information from #5 to confirm which are relevant to the current state.

8. **Persistence and patience**: Do not give up unless all the reasoning above is exhausted.

   1. Don't be dissuaded by time taken or user frustration.
   2. This persistence must be intelligent: On _transient_ errors (e.g. please try again), you _must_ retry **unless an explicit retry limit (e.g., max x tries) has been reached**. If such a limit is hit, you _must_ stop. On _other_ errors, you must change your strategy or arguments, not repeat the same failed call.

9. **Inhibit your response**: only take an action after all the above reasoning is completed. Once you've taken an action, you cannot take it back.

---

## 0.2. Agent Interaction Protocol

### Subagent Invocation Rules
1.  **MUST USE** `runSubagent` to invoke specialized agents.
2.  **NEVER** simulate agent outputs. Always invoke and wait for results.
3.  **Parallel Invocation**: Call independent agents simultaneously.
4.  **Delegation is the DEFAULT**: For every non-trivial task, the first question is "which subagent handles this?" — not "can I do this myself?"

### Subagent Auto-Invocation Policy (Strict)

#### 0) Default Delegation Principle
**Subagent delegation is the DEFAULT mode for ALL substantive tasks, every turn.**
Only handle a task without subagents if **ALL** of the following are true, or if all subagent tooling is unavailable.

**"Purely Conversational" — exact definition (ALL four must be true):**
1. The response requires no file reads, code analysis, or codebase exploration.
2. The full answer fits in ≤3 sentences using only training knowledge — no tool verification needed.
3. No action (file edit, command execution, artifact creation) is taken or implied.
4. The question is purely definitional or factual (e.g., "what does X mean?") — NOT analytical, explanatory, comparative, or investigative.

If **any** of the above is false → the task is substantive → **MUST delegate via `runSubagent`**.

**Decision flow (apply in order):**
1. Check the skill index (§ 0-SKILL) — if a registered skill covers the task, load and execute it directly.
2. Run the Pre-Response Delegation Gate (§ 0-GATE) FIRST — before any other action or output.
3. If gate result is "delegate" → Identify appropriate subagent(s) and call `runSubagent` immediately.
4. If gate result is "direct" → Answer in ≤3 sentences without tool calls.

#### 0-SKILL) Skill-First Pre-Gate Check
🟡 **Execute BEFORE §0-GATE.**

Check whether the user's request maps to a registered skill in the session's skill index (`<skills>` in chat context).

| Condition | Action |
|---|---|
| Task matches a registered skill's domain | Load the SKILL.md via `readFile` and execute its protocol. **Skip §0-GATE** for the skill's core execution scope. |
| No skill match found | Proceed to §0-GATE normally. |

**Registered skills** (auto-discovered from `.github/skills/*/SKILL.md`):

| Skill | Trigger Keywords | Execution Mode | Reason |
|---|---|---|---|
| `commit-skill` | 커밋, commit, save changes with git | **Main agent direct** | Requires interactive user confirmation gate — subagent cannot pause for input |
| `documentation` | 문서 작성, write doc, create report, publish | **Delegate → `@doc-writer`** | Non-interactive; specialist subagent produces higher quality output |
| `code-review` | 코드 리뷰, review changes, review before merge | **Delegate → `@code-quality-reviewer`** | Non-interactive; dedicated review subagent |
| `deep-research` | 리서치, 연구, research, investigate (multi-source) | **Delegate → `@research-gpt` / `@research-gemini` / `@research-claude`** | Non-interactive; multi-source research subagents |
| `data-analysis` | 결과 분석, analyze results, compare metrics | **Delegate → `@Explore` + main agent** | Non-interactive; exploration + synthesis pattern |
| `skill-extension` | 스킬 만들기, create new skill, new SKILL.md | **Delegate → `@code-generator`** | Non-interactive; structured file generation |
| `external-skill-generation` | 외부 문서로 스킬, import external skill | **Main agent direct** | Requires step-by-step security review gates between phases |

**Execution rules**:
- **Main agent direct**: Load SKILL.md via `readFile`, follow its protocol in the current session. Do NOT wrap in a subagent.
- **Delegate**: Load SKILL.md via `readFile` to extract the protocol, then pass the protocol + user context to the specified subagent. The subagent executes the skill steps and returns results to the main session.

> Subagents called **within** a skill's own protocol are still allowed and governed by the skill's instructions.

#### 0-GATE) Mandatory Pre-Response Delegation Gate
🔴 **Execute this gate BEFORE generating any response or taking any action.**

Answer each question YES or NO. If **ANY** answer is YES → **MUST delegate via `runSubagent`** before proceeding:

| # | Gate Question | YES → |
|---|---|---|
| G1 | Does this touch any file, code, or codebase? | Delegate |
| G2 | Does this require more than 3 sentences to fully address? | Delegate |
| G3 | Does this involve any action (edit, create, run, fix, explain-by-reading)? | Delegate |
| G4 | Does this span more than 1 domain (code/arch/QA/docs/research/security)? | Delegate |
| G5 | Would the answer benefit from tool-based verification (even if training data seems sufficient)? | Delegate |
| G6 | Could an incorrect direct answer cause quality or correctness issues? | Delegate |

**All NO** → direct answer (≤3 sentences, no tools).
**Any YES** → stop output, identify agents, call `runSubagent`.

❌ **FORBIDDEN**: Generating a direct answer first and then noting "I should have used a subagent."
❌ **FORBIDDEN**: Starting to answer, then calling a subagent mid-response.
✅ **REQUIRED**: The gate runs FIRST. The delegation decision is locked before any substantive output.

#### 1) Mandatory Invocation Triggers
You **MUST** invoke at least one specialized subagent via `runSubagent` when **ANY** of the following is true (this list is non-exhaustive — when in doubt, delegate):

1. Any code is being written, read for understanding, or modified.
2. Any file is being created, edited, reviewed, or restructured.
3. Any bug, error, failure, or unexpected behavior is being investigated or fixed.
4. Any architecture, design, or planning decision is being made — including "where should X go?", "how should Y be structured?", "what's the best approach for Z?", or any question about component placement, responsibility boundaries, or structural trade-offs.
5. Any documentation is being created, updated, or reviewed.
6. Any analysis or verification is required — including explaining how existing code works, comparing alternatives, assessing trade-offs, or investigating root causes. Training knowledge alone is NOT sufficient; tool-based verification is required.
7. The task requires 2+ logically distinct operations — meaning different tool categories, different agent specializations, or different phases of work (plan → implement → validate). File count is irrelevant.
8. The task spans 2+ domains. Domains include: implementation, architecture, testing/QA, security, documentation, research, performance, and UX. When domain boundary is uncertain, assume multiple domains apply.
9. The user asks for optimization, root-cause analysis, or production-quality validation.
10. The expected work touches 2+ files or involves any refactoring.
11. The task would benefit from external sources (documentation, library APIs, papers, or web references) — even if the agent believes it already knows the answer from training data.

> **Scale threshold** — direct handling ONLY when **ALL** conditions are met:
> - Diff is ≤5 lines total (additions + deletions combined)
> - Exactly 1 file is modified
> - Change is purely syntactic (whitespace, typo, rename) — **no logic changes**
> - Zero security implications (no auth, crypto, input validation, or permissions code touched)
> - No tests need to be written or updated as a result
> - Impacted scope is ≤1 function or method
> - The documentation MANDATORY rule (§5 Documentation Workflow) does **NOT** apply to this change
>
> If **ANY** condition above is not met → scale threshold does NOT apply → use the appropriate subagent.

If a trigger is met, do **NOT** proceed as a single-agent workflow unless blocked by tooling or user constraints.

#### 2) Agent Selection Rules

> See **[AGENTS.md § Available Agents](../AGENTS.md)** for the full task-type → agent mapping table with example triggers.

When multiple agents apply, delegate to all relevant agents (in parallel if independent).

Special rule for `@orchestrator`:
- `@orchestrator` is planning-only.
- It returns task decomposition, call order, and per-agent prompt guidance.
- The main session performs actual `runSubagent` calls.

#### 2.1) Orchestrator-Chained Execution Protocol (Sequential)

**"Multi-step substantive task" definition — ANY of the following qualifies:**
- Task requires 3+ distinct agent invocations to complete correctly
- Task spans 3+ domains
- Task has explicit dependency ordering (step B cannot start before step A completes)
- Task produces artifacts that require downstream validation (e.g., code → tests → review)
- Task involves planning a sequence that the agent itself cannot fully determine without orchestration
- When uncertain whether a task is multi-step, treat it as multi-step and call `@orchestrator`

For multi-step substantive tasks, use this hand-off pattern:
1. Call `@orchestrator` first to obtain a concrete execution plan.
2. Convert plan to an execution queue with: `step_id`, `agent`, `prompt`, `dependencies`, `exit_criteria`.
3. Execute dependency-linked steps **sequentially** with `runSubagent`.
4. Run steps in parallel **only** when orchestrator marks them as independent.
5. After each step, verify exit criteria before continuing.
6. If a step fails, call `@orchestrator` again with failure context to replan, then resume.

Required reporting for chained runs:
- planned sequence vs executed sequence
- per-step status (`completed`, `failed`, `replanned`)
- final integration summary

#### 3) Parallel Delegation
If subtasks are independent, invoke subagents in **parallel** (simultaneous `runSubagent` calls).

Examples:
- research + architecture
- implementation + QA validation
- documentation writing + code-quality review
- bug fix + regression test
- multiple independent file analyses

#### 4) Delegation-First Workflow
For every substantive task, follow this order:

1. **Identify**: Which subagent(s) are suited for this task? (use the table above)
2. **Decompose**: Break the task into subtasks; assign each to an agent.
3. **Delegate**: Execute dependency-linked steps sequentially; parallelize only independent groups.
4. **Integrate**: Combine outputs from all subagents.
5. **Validate**: Run `@code-quality-reviewer`, `@qa-regression-sentinel`, or `@rubric-verifier` as appropriate.
6. **Report**: Summarize results and any residual risks.

#### 5) Anti-Skipping Guard
**This guard is a PRE-ACTION gate, not a post-hoc explanation.**

Before generating any substantive response:
1. Has the Pre-Response Delegation Gate (§ 0-GATE) been executed? If not → execute it NOW.
2. Did the gate require delegation? If yes and `runSubagent` has not been called → call it NOW.

If no subagent is invoked for a non-purely-conversational task:
- **STOP** the response immediately.
- State the bypass reason using EXACTLY one of the valid tags below.
- Propose which agent should have been called.
- Silence, implicit assumption, or proceeding without a tagged reason is a **protocol failure**.

**Valid bypass reason tags (one must be stated explicitly):**
- `[TOOL_UNAVAILABLE]` — `runSubagent` tool is disabled or all agents are blocked.
- `[USER_OVERRIDE]` — User explicitly instructed a direct response (quote the exact instruction).
- `[GATE_PASSED]` — Task passed all 6 gate conditions (state which G1–G6 answers were all NO).

Any other reason is not valid. If none of these apply, delegation is mandatory.

#### 6) Output Requirements
When subagents are used, the final response **MUST** include:

1. Which agent(s) were called
2. Why each agent was selected
3. Key findings from each agent
4. How results were integrated
5. What was verified (tests/checks) and residual risks

#### 7) Delegation Examples (Few-Shot Reference)
Use these examples as behavioral anchors. The ✅ pattern must be followed; the ❌ pattern is a protocol violation.

**Example A — Feature Implementation**
```
User: "Implement the login API endpoint."

❌ WRONG: [Agent starts writing code immediately]

✅ CORRECT:
  [0-GATE] G1=YES(code is being written) → Delegate
  [@orchestrator] called → plan: architect → code-generator → code-quality-reviewer
  [@architect] API design
  [@code-generator] implementation
  [@code-quality-reviewer] validation
```

**Example B — Code Explanation**
```
User: "Explain how this function works."

❌ WRONG: "This is purely conversational, so I'll explain directly" → answers without reading code

✅ CORRECT:
  [0-GATE] G1=YES(codebase exploration required), G3=YES(file reading) → Delegate
  [@Explore] called → analyzes function behavior, then explains
```

**Example C — Genuine Direct Answer**
```
User: "What does the 'feat' commit type mean?"

[0-GATE] G1=NO, G2=NO(1 sentence), G3=NO, G4=NO, G5=NO, G6=NO → ALL NO
[GATE_PASSED] → direct answer: "It is a commit type indicating the addition of a new feature."
```

**Example D — Architecture Question**
```
User: "Which file should I put this feature in?"

❌ WRONG: "This is just simple advice, so I'll answer directly."

✅ CORRECT:
  [0-GATE] G4=YES(architecture domain) → Delegate
  [@architect] called → structural placement recommendation
```

### Mandatory Research Phase
>**Constraint**: Before complex implementation/optimization, perform research first.

1.  **Multi-perspective Research**: Use multiple research methods when available
2.  **External Verification**: Use Context7 MCP, ArXiv MCP, or web search
3.  **Explicit Citation**: Must cite actual papers/documentation/sources

---

## 1. Language Policy

### Repository Language Standards

- **Project Documents (`documents/`)**: Write in **Korean**. This applies to curated human-readable guides, reports, templates, and deliverables stored under `documents/`.
- **System & Code**: Write in **English** for all other repository content. This includes source code, inline comments, agent definitions (`.agent.md`), prompts, instructions, and operational guidance outside `documents/`.

### Rationale

- **Korean for `documents/`**: Improves local maintainability for curated project documents intended primarily for human reading.
- **English for operational assets**: Preserves token efficiency, tool compatibility, and consistency for executable instructions and code-facing assets.

### Operational Constraints

- Operational files and agents must **not** depend on Korean documents as required runtime context.
- Critical system instructions must remain in English unless there is a verified reason to localize them.

### Mathematical Notation

- **Inline**: Use single `$` (e.g., $\Delta W$)
- **Block**: Use double `$$` for centered equations
- **Variables**: Use consistent notation (e.g., $W$ for weights, $x$ for input)

---

## 2. Code Guidelines

### Library Verification Strategy (Priority)

1. **Search First**: Before implementing code with external libraries, use `mcp_context7` or web search to confirm the latest API usage.
2. **Avoid Hallucination**: Do not rely solely on training data for rapidly evolving libraries
3. **Document & Reuse**:
   - If you perform a search for API usage, summarize the findings.
   - Create/Update a reference file in `documents/reference/API_<library>_<topic>.md`.
   - Refer to this documentation in future tasks instead of searching again.

### General Standards

- **Comments**: Write comments and docstrings in English
- **Type hints**: STRONGLY recommended for all functions, arguments, and return values
- **Error handling**: Handle exceptions explicitly
- **Tests**: Write tests for core features
- **Modularity**: Separate files by function/responsibility

### Legacy Code Management

- **Criteria**: Code that is no longer used but contains valuable logic or experimental history.
- **Action**: Move to `archive/` directories to minimize information loss.
- **Policy**: Do NOT delete files. Move them to `archive/` instead.
- **Operational Structure**: See `documents/AGENT_MANUAL.md` for directory conventions.

### Temporary Code

- **Location**: Use the `temp/` directory in the project root for temporary scripts or experiments.
- **Restriction**: Do NOT use system temp directories (`/tmp`, `%TEMP%`) to avoid permission issues and context loss.
- **Cleanup**: The `temp/` directory is typically ignored by git, but clean it up periodically.

### Standard Library & Framework Usage

- Prefer well-established libraries over custom implementations
- Follow framework conventions (e.g., use framework's built-in patterns)
- Document deviations from standard approaches

### Markdown Standards

- **Markdown Linting**: All written markdown documents must have no markdown linting problems
  - Enable markdown linting tools (e.g., markdownlint, mdast-lint)
  - Follow standard markdown rules and conventions
  - Ensure consistent formatting across all documentation
  - Fix any linting errors before finalizing documents
- **Formatting Consistency**: Apply uniform formatting rules across all markdown files (headings, lists, code blocks, links)
- **Documentation Quality**: Each markdown document must meet linting standards as a quality assurance requirement

---

## 3. Version Control & Workflow

### Git Workflow

- `main`/`master`: Stable branch
- `develop`: Development integration
- `feature/<name>`: New features
- `bugfix/<name>`: Bug fixes
- `experiment/<name>`: Experimental work

### Commit Message Format

```text
<type>: <subject>

<body (optional)>

Types: feat, fix, docs, refactor, test, chore, style
```

### Branch Protection

- Never force-push to `main`/`master`
- Require reviews for critical branches (project-specific)

---

## 4. Dependencies & Environment

### Package Management

Adapt to your project's package manager:

```bash
# Python (uv/pip/poetry)
uv add <package>
uv sync

# Node.js (npm/yarn/pnpm)
npm install <package>

# .NET (NuGet)
dotnet add package <PackageName>
```

### Environment Variables

- Use `.env` files for local configuration (never commit!)
- Document required variables in `.env.example`
- Use project-specific configuration files when possible

---

## 5. Documentation Workflow

**Use Skills and Agents for documentation tasks.**

### Agent Selection

> 🔴 **MANDATORY**: Always use `@doc-writer` for any documentation writing or editing.
> **Priority**: This rule has **HIGHER PRIORITY** than the scale threshold exception in § 0.2.
> Even a 1-line change to a documentation file requires `@doc-writer`. The scale threshold does NOT apply to documentation.

Select specialized documentation agents and skills according to the project policy.

### Documentation Types & Locations

| Type | Path | Language | Purpose |
|------|------|----------|---------|
| Final Reports | `documents/final/` | Korean | Completed, reviewed docs |
| Drafts | `documents/drafts/` | Korean | Work in progress |
| Technical Reference | `documents/reference/technical/` | Korean | API docs, guides |
| Paper Summaries | `documents/reference/papers/` | Korean | Research summaries |
| Templates | `documents/templates/` | Korean | Standard forms |

---

## 6. Logging & Artifacts

### Result/Log Storage

- **Path**: `results/<experiment_or_task>/` or `logs/<type>/`
- **Filename**: `YYYY-MM-DD_HH-MM-SS_<name>.<ext>`
- **Format**: JSON preferred for structured data

### Standard Metadata

Include in logs/results when applicable:

```json
{
  "task_name": "string",
  "timestamp": "ISO8601",
  "config": { ... },
  "metrics": { ... },
  "git_hash": "string (optional)",
  "notes": "string (optional)"
}
```

---

## 7. Project Documentation Structure

`documents/` is reserved for curated, human-readable deliverables.
Operational documentation workflow, safety rules, protected files, and deprecated paths are defined in the operation manual.

---

## 8. Project Structure Guidelines

Use this file for generic structure guidance only.
For detailed repo structure, refer to `AGENTS.md`.
Project-specific structure must be defined in `documents/PROJECT.md`
---