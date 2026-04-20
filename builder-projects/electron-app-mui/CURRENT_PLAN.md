Current Plan
============

Summary
- Introduce an EditorWrapper to wrap all existing editors so they can conform to a new onCommit/getValue/setValue API from the parent.
- The wrapper forwards onChange to onCommit (no edits to editors themselves).
- Phase 1: Implement EditorWrapper and wrap all current editors without migrating planes-quiz yet.
- Phase 2: Incrementally migrate editors to the new API (plane-quiz as initial pilot, then others).
- Phase 3: Refactor ProjectPage to leverage getValue/setValue/onCommit for editor interactions; no onChange usage by the parent after full migration.

Assumptions and constraints
- Commit is not a explicit action in the wrapper; the editor will call onCommit at appropriate times. getValue will be used to retrieve current internal values when needed (e.g., undo/save).
- The wrapper’s job is to minimize changes to editor internals and avoid broad rewrites.
- Plane-quiz remains unmodified in code; it will be wrapped by EditorWrapper to align with new API in the migration plan, but we are not reworking its internals in this phase.

Phases
- Phase 0 (this turn): Implement EditorWrapper and apply to all editors via registry wrapping. No editor code changes. The parent still uses onChange for history; wrapper forwards to onCommit.
- Phase 1 (next steps): Start migrating editors to support onCommit directly and implement getValue/setValue usage, with editor-level imperative handles if needed.
- Phase 2 (future): Migrate plane-quiz and remaining editors to full onCommit/getValue/setValue surface, deprecating onChange entirely from the editor usage path.

Deliverables
- EditorWrapper component (ready to wire into registry).
- Registry wiring to wrap all current editors with EditorWrapper.
- ProjectPage adjustments to begin consuming getValue/setValue/onCommit in preparation for Phase 2 (not done in this patch).

Questions for you
- Do you want the registry-wrapped EditorWrapper to be the canonical Editor component in all registry entries immediately, or would you prefer a toggle to opt-in per-editor to ease debugging?
- Are there any editors with unusual props that may require mapping in the wrapper (e.g., custom onChange handlers or extra callbacks)?
