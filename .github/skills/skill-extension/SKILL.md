---
name: skill-extension
description: 'Create or refine a single-responsibility SKILL.md with valid frontmatter, clear triggers, and executable protocol for this template.'
---

# skill-extension

## Usage

Use this skill when creating a new skill or improving an existing one under .github/skills/.

## Responsibility

This skill owns skill authoring quality:

- Scope: structure, frontmatter validity, trigger clarity, and execution steps.
- Out of scope: solving unrelated product features.

## Required Conventions

- Path: .github/skills/<skill-name>/SKILL.md
- Frontmatter required:
  - name
  - description (single quotes, 10-1024 chars)
- One skill should own one primary responsibility.
- Operational guidance is written in English.

## Protocol

1. Define purpose
- Name the one core job this skill performs.
- Reject mixed responsibilities.

2. Define trigger
- Specify user intents or conditions that should activate this skill.

3. Draft executable protocol
- Write short, ordered steps that can be directly executed.
- Include expected output contract.

4. Validate frontmatter and naming
- name matches folder name.
- description meets length and quote rules.

5. Add integration notes
- Mention related skills only when handoff is clear.
- Avoid duplicated workflows across skills.

## Minimal SKILL.md Skeleton

```markdown
---
name: my-skill
description: 'Short, specific, and executable skill purpose statement.'
---

# my-skill

## Usage

## Responsibility

## Protocol

## Output Contract
```

## Exit Criteria

A skill is ready when:

- Trigger conditions are unambiguous
- Protocol is directly executable
- Scope does not overlap heavily with another skill
