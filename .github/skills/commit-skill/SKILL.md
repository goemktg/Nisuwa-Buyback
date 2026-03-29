---
name: commit-skill
description: 'Strict workflow for Git commits: inspect changes since last commit, generate a Conventional Commits message, show summary, and require explicit user confirmation before commit.'
---

# commit-skill

## Usage

Use this skill when the user asks to commit or save current git changes.

## Trigger Intents

- 커밋 진행
- 커밋
- commit
- commit 진행
- save changes with git

## Mandatory Safety Rule

Never run git commit without explicit approval in the current conversation turn.

## Change Inspection Rule

Always run the OS-appropriate inspection script first. Base analysis on script output only.

- macOS/Linux: sh .github/skills/commit-skill/scripts/inspect-changes.sh
- Windows: cmd /c .github\skills\commit-skill\scripts\inspect-changes.cmd

## Workflow

1. Inspect working tree and changes since HEAD with the inspection script.
2. Summarize changed files and change intent.
3. Generate a Conventional Commits candidate message.
4. Ask for explicit confirmation before commit.
5. On approval, stage relevant files and execute commit.

## Commit Message Rules

- Analyze staged and unstaged changes since HEAD.
- Subject format: <type>(<scope>): <subject> in English.
- Optional body: concise Korean bullets for change details.
- Allowed types: feat, fix, docs, refactor, test, chore, style, perf.
- If unrelated changes exist, recommend commit split.

## Confirmation Rules

- Approve examples: 진행, yes, approve, 커밋해.
- Reject examples: 취소, no, cancel, stop.
- Ambiguous input: ask clarification and do not commit.

## Failure Handling

- No changes: report and stop.
- Inspection script failure: report script error and stop.
- Commit failure: report error and ask retry intent.
- Protected branch warning: alert for main, master, or develop.

## Output Template

```text
변경 요약:
- <file 1>: <short change>
- <file 2>: <short change>

제안 커밋 메시지:
<type>(<scope>): <english subject>

- <한글 세부 변경사항 1>
- <한글 세부 변경사항 2>

위 메시지로 커밋을 생성할까요?
```

