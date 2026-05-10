## Workflow

- Enter plan mode for non-trivial tasks: 3+ steps, risky edits, migrations, or architectural decisions.
- Inspect relevant code and tests before editing.
- Write the plan to `tasks/todo.md` before coding.
- Re-plan if new information changes the approach.
- Do not mark work complete without verification.

## Task Tracking

- Maintain `tasks/todo.md` with checkable items.
- Mark items complete only after they are verified.
- Add a short results section for completed work.

## Lessons Learned

- After any user correction or preventable mistake, update `tasks/lessons.md`.
- Record the mistake, root cause, and preventative rule.

## Engineering Standards

- Prefer the simplest correct solution.
- Minimize code changes and blast radius
  .
- Fix root causes unless a temporary patch is explicitly requested.

## Verification

- Run relevant tests before completion.
- Check affected behavior, edge cases, and regressions.
- If verification cannot be completed, say so clearly and note the risk.

<!-- code-review-graph MCP tools -->

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool                        | Use when                                               |
| --------------------------- | ------------------------------------------------------ |
| `detect_changes`            | Reviewing code changes — gives risk-scored analysis    |
| `get_review_context`        | Need source snippets for review — token-efficient      |
| `get_impact_radius`         | Understanding blast radius of a change                 |
| `get_affected_flows`        | Finding which execution paths are impacted             |
| `query_graph`               | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes`     | Finding functions/classes by name or keyword           |
| `get_architecture_overview` | Understanding high-level codebase structure            |
| `refactor_tool`             | Planning renames, finding dead code                    |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
