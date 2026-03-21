# AGENTS.md

## Workflow

- Enter plan mode for any non-trivial task (3+ steps, architectural choices, migrations, or risky edits).
- Write the implementation plan to `tasks/todo.md` before coding.
- Re-plan immediately if new information invalidates the current plan.
- Use subagents for isolated research, exploration, and parallel analysis when available.
- Do not mark work complete without verification.

## Task Tracking

- Maintain `tasks/todo.md` with checkable items.
- Mark items complete as progress is made.
- Add a short review/results section at the end of each completed task.

## Lessons Learned

- After any user correction, update `tasks/lessons.md`.
- Record the mistake, root cause, and a preventative rule.

## Engineering Standards

- Prefer the simplest correct solution.
- Minimize code changes and blast radius.
- Fix root causes; avoid temporary patches unless explicitly requested.
- For non-trivial changes, consider whether there is a cleaner design before finalizing.

## Verification

- Run relevant tests before completion.
- Compare before/after behavior when relevant.
- Check logs, failing tests, and edge cases.
- Final work should meet staff-engineer review standards.
