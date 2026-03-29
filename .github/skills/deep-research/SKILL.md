---
name: deep-research
description: 'Perform multi-source, citation-backed research and deliver Korean reports with traceable evidence and practical recommendations.'
---

# deep-research

## Usage

Use this skill for complex investigations that need multiple sources, cross-checking, synthesis, and decision-grade outputs.

## Responsibility

This skill owns research workflow only:

- Scope: question framing, source collection, validation, synthesis, and reporting.
- Out of scope: direct production code changes unless explicitly requested.

## Path Policy

- temp/: temporary downloads, extracted notes, throwaway validation scripts
- documents/drafts/: evolving research narrative and interim conclusions
- documents/reference/: stable references, papers, technical source summaries
- documents/final/: final Korean report for stakeholders

## Protocol

1. Frame the research
- Define objective, constraints, and success criteria.
- Split into answerable sub-questions.

2. Collect evidence
- Prefer official docs, primary papers, and authoritative specs.
- Record source metadata early: title, link, version, date.

3. Validate claims
- Cross-check important claims with at least two independent sources.
- Flag unresolved contradictions explicitly.

4. Synthesize findings
- Build a concise argument chain from evidence to conclusion.
- Separate facts, assumptions, and recommendations.

5. Publish by stage
- Store working content in documents/drafts/.
- Save reusable source summaries in documents/reference/.
- Publish final stakeholder output to documents/final/ in Korean.

## Output Contract

Every delivery includes:

- Research question
- Methods and source list
- Verified findings
- Risks and unknowns
- Actionable next steps

## Quality Bar

- Claims are citation-backed
- Scope boundaries are explicit
- Conclusions are operationally useful, not generic
