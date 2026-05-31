# Domain Docs

Single-context layout. One `CONTEXT.md` + `docs/adr/` at repo root.

## Consumer rules

When `/improve-codebase-architecture`, `/diagnose`, or `/tdd` read context:

- **Always** read `CONTEXT.md` first — it contains the domain glossary and architectural decisions summary
- Then check `docs/adr/` for any ADRs relevant to the area being touched
- Use the domain language from CONTEXT.md in all communication — never re-invent terminology
