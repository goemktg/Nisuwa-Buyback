---
name: data-analysis
description: 'Analyze experiment results into reproducible metrics, charts, and Korean decision summaries aligned with project artifact paths.'
---

# data-analysis

## Usage

Use this skill when comparing runs, interpreting metrics, or producing analysis-ready artifacts from result files.

## Responsibility

This skill owns analysis workflow only:

- Scope: data loading, metric comparison, visualization, and report-ready summaries.
- Out of scope: model retraining, production deployment, or architecture refactor.

## Path Policy

- temp/: temporary merged datasets and scratch notebooks/scripts
- documents/drafts/: interim analysis narrative and open questions
- documents/final/: final Korean analysis report and decision summary
- documents/reference/: reusable analysis methodology and metric definitions

## Protocol

1. Define analysis question
- Clarify baseline, success metrics, and comparison window.

2. Collect and normalize inputs
- Load results from canonical result/log sources.
- Normalize schema and units before comparison.

3. Compute metrics
- Calculate primary and secondary metrics consistently.
- Include uncertainty or variance when available.

4. Visualize
- Use readable plots with clear labels and units.
- Avoid decorative charts that hide magnitude.

5. Interpret
- Distinguish observation from recommendation.
- Explain practical impact in Korean for documents/ outputs.

6. Publish artifacts
- Keep temporary calculation files in temp/.
- Move narrative into documents/drafts/, then finalize in documents/final/.

## Output Contract

Each delivery contains:

- Data scope and baseline
- Metric definitions used
- Key plots or tables
- Main findings and limits
- Recommended next experiment or action

## Quality Bar

- Reproducible metric calculations
- Explicit assumptions and filtering rules
- No conclusion without numeric evidence
