---
name: code-review
description: 'Run a production-focused review for correctness, regressions, policy compliance, and maintainability before merge or commit.'
---

# code-review

## Usage

Use this skill when reviewing code or configuration changes before commit, merge, release, or handoff.

## Responsibility

This skill owns review and risk detection only:

- Scope: defects, regressions, policy violations, test gaps, maintainability risks.
- Out of scope: feature implementation and broad architecture redesign.

## Review Priorities

1. Correctness and behavior
- Does the change do what the user intended?
- Any edge-case failure, null path, or state inconsistency?

2. Regression risk
- Could existing behavior break for current users?
- Are compatibility assumptions explicit?

3. Policy and structure compliance
- Operational files: English.
- documents/: Korean.
- Skill files use .github/skills/<skill-name>/SKILL.md with valid frontmatter.

4. Verification quality
- Are tests updated where behavior changed?
- If no test, is a clear rationale provided?

## Repository-Specific Checks

- SKILL.md frontmatter has name and description only as required fields.
- description uses single quotes and stays within 10-1024 chars.
- One-skill-one-responsibility is preserved.
- File placement matches repository structure and purpose.

## Review Output Format

Return findings in severity order:

1. Critical
2. High
3. Medium
4. Low

For each finding include:

- Location (file path and line)
- Why it is a risk
- Minimal fix recommendation

If no findings exist, state:

- No blocking findings
- Residual risks
- Testing gaps (if any)

## Exit Criteria

Review is complete when:

- No unresolved critical or high findings remain
- Policy compliance is verified
- Verification status is explicitly documented
