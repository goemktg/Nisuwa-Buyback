---
name: documentation
description: 'Create and maintain project documents with strict language and path policy, from drafts to final publication-ready deliverables.'
---

# documentation

## Usage

Use this skill when a task requires creating or updating project documents, notes, reports, references, or publication-ready markdown outputs.

## Responsibility

This skill owns documentation authoring workflow only:

- Scope: planning, drafting, polishing, and publishing docs.
- Out of scope: code implementation, runtime debugging, package management.

## Project Policy

- Operational assets must be written in English.
- Content under documents/ must be written in Korean.
- Keep one task narrative in one document; avoid duplicated sources of truth.

## Canonical Paths

Use these paths consistently:

- documents/drafts/: in-progress structured drafts
- documents/final/: reviewed, stable deliverables
- documents/reference/: durable technical or research reference
- temp/: temporary raw notes, extraction outputs, disposable artifacts

## Protocol

1. Classify request
- Decide doc type: draft, final report, or reference.
- Decide target audience and required depth.

2. Place file correctly
- Start in documents/drafts/ unless the user explicitly asks for final output.
- Move or rewrite to documents/final/ after review-ready quality is reached.
- Store evergreen material in documents/reference/.

3. Write with policy compliance
- Write document prose in Korean for documents/ files.
- Keep commands, code blocks, and identifiers in English.
- Keep headings stable and searchable.

4. Quality pass
- Remove ambiguity and repeated statements.
- Verify internal links and section consistency.
- Ensure markdown linting passes.

5. Publication handoff
- Summarize what changed and where.
- Note unresolved questions and next updates.

## Output Contract

Each delivery should include:

- Target file path
- Purpose in one sentence
- Key sections added or updated
- Risks or assumptions, if any

## Minimal Template

Use this skeleton when structure is unclear:

```markdown
# 제목

## 목적

## 배경

## 핵심 내용

## 검증 또는 근거

## 결론

## 후속 작업
```
