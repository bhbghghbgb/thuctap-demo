I’m in plan/read-only mode and will not modify any files yet. Below are the concrete plan and project context you can review. If you approve, I’ll proceed with implementing thePlane-quiz pilot in a subsequent turn.

Context quick recap
- Goal: Implement editors so they manage their own (inner) state with React Hook Form, effectively making them uncontrolled from the parent’s perspective, to reduce rerenders of the editor component. Editors will still call onCommit when an action requires archiving history (as part of the existing workflow).
- Pilot editor: plane-quiz (Plane Quiz). This is chosen because it has non-trivial input fields (questions, answers, images) and provides a representative surface for improvements without risking the entire codebase.
- Constraints: The project currently relies on an onChange/onCommit history mechanism. For now we cannot overhaul the entire state mutation/immutability behavior inside editors; the migration pattern should work within the existing archival flow and not require broad refactors.

Project context (for reuse)
- Repository: Electron-based builder app with multiple editors (plane-quiz, group-sort, etc.).
- Editor lifecycle: Parent page (ProjectPage) renders Editor with props including appData and onChange, and onChange is used to push data into history for undo/redo.
- Desired migration pattern: Introduce an intermediate “uncontrolled editor” approach (internal form state) that reduces parent render triggers, while still emitting commit events for archival actions via onCommit. The pilot will be plane-quiz.

Current plan
- Phase 0 (in preparation): Define exact new API surface and supporting wrapper components, ensuring compatibility with existing registry wiring. Establish the minimal surface area required to migrate plane-quiz with no breaking changes to other editors in this sprint.
- Phase 1: Infrastructure
  - Add an EditorWrapper (universal pattern) to renderer side that can wrap an editor and expose:
    - getValue(): AnyAppData
    - setValue(data: AnyAppData): void
    - commit(): void (optional, triggers onCommit with current internal value)
  - Update typing in the registry to allow an editor to be used with the wrapper (backward-compatible until fully migrated).
  - Integrate React Hook Form in the wrapper to manage inner form state without forcing parent re-renders on every keystroke.
  - Ensure the wrapper preserves the existing onCommit/onChange contract where needed (onCommit for archival actions; onChange preserved as a hook for existing history wiring until fully migrated).
- Phase 2: Plane-quiz pilot
  - Replace plane-quiz editor internals to be RHF-driven inside the wrapper (internal state only; parent is not re-rendered on every keystroke).
  - On blur of text fields, update internal form state but do not propagate to parent immediately.
  - On explicit action to archive/history (the “commit” action), call onCommit with an immutable copy of the current internal form state.
  - Expose an imperative handle on the plane-quiz editor to allow parent to call getValue/setValue/commit as needed for history and undo flows.
- Phase 3: ProjectPage integration for the pilot
  - Update ProjectPage to use the wrapper’s API for plane-quiz while keeping compatibility for other editors.
  - Ensure that explicit archive actions call onCommit with the current immutable data copy, and that the undo/redo flow continues to work logically with the new internal state management.
- Phase 4: Validation and performance checks
  - Validate that plane-quiz rendering is less frequently causing parent re-renders.
  - Run type checks and local tests; ensure no regressions in other editors.
- Phase 5: Documentation and migration notes
  - Document the wrapper usage pattern and plan for migrating remaining editors in a follow-up phase.
  - Update FORM_LIBRARY_MIGRATION_PLAN.md (or create a complementary file) with observed outcomes, edge cases, and follow-up tasks.

Proposed concrete changes to plane-quiz (pilot)
- Create PlaneQuizEditorUncontrolled.tsx (or similar) in plane-quiz folder
  - Use useForm<PlaneQuizAppData> to manage internal form state
  - Bind inputs to form fields, but do not rely on parent appData changes for rendering
  - On blur of fields, update internal form state only
  - On commit, call props.onCommit with a new immutable copy of the current internal form data
  - Expose an imperative handle via forwardRef/useImperativeHandle:
    - getValue(): PlaneQuizAppData
    - setValue(data: PlaneQuizAppData): void
    - commit(): void
- Create EditorWrapper.tsx (generic)
  - Accept props: initialData, projectDir, onCommit, onChange (for backward compatibility)
  - Manage a local form state via RHF, but only propagate to parent on commit
  - Expose the imperative handle (if desired by the parent) or provide an API for the plane-quiz to call commit
- Update registry types (src/renderer/src/games/registry.ts)
  - Keep compatibility by allowing the Editor to be either a plain component accepting onChange, or a wrapper around the new editor that uses onCommit
  - Ensure that plane-quiz now can be wired to the wrapper and to RHF without breaking existing imports
- Update ProjectPage.tsx
  - Integrate the new EditorWrapper usage for plane-quiz
  - Ensure the existing history mechanism is preserved by calling onCommit only during explicit archival actions
  - Maintain current behavior for other editors during migration

Key questions to finalize before implementation
1) API compatibility and naming
- Do you want to keep both onChange and onCommit props on the Editor during the pilot, with onCommit strictly used to archive on explicit commit actions, and onChange preserved for compatibility, or do you want to start replacing onChange with onCommit for the plane-quiz pilot only?
2) Commit trigger semantics
- For plane-quiz, should onCommit be triggered only by a user-initiated archive/history action (e.g., Save/Archive button or explicit “Archive History” action), or should blur events also trigger onCommit if a user moves away from a field?
3) Data shape and transforms
- Plane-quiz AppData type (PlaneQuizAppData) needs to be clarified: fields for questions, options, correct answers, images, and any per-question metadata. Please confirm the exact type shape currently used in this repo so I can implement the RHF bindings correctly.
4) Wrapper API surface
- Is it acceptable to introduce a generic EditorWrapper with a minimal API (getValue, setValue, commit) and adapt plane-quiz to use it, while keeping a non-breaking path for existing editors?
5) Progress gating
- Is it acceptable to target plane-quiz as the sole pilot editor in this sprint and postpone migration for the rest until after you validate the approach?

Deliverables you’ll get after approval
- A concrete migration plan document (Phase 0–Phase 4) tailored to this repo and the plane-quiz pilot
- A project-context document summarizing architecture, risks, and decisions for reuse
- A proposed API surface for the EditorWrapper and the plane-quiz integration plan (without applying code changes yet)

What I need from you to proceed
- Confirm which of the following you want:
  - A) Use a dual API (onChange for compatibility and onCommit for archival) during the pilot
  - B) Move plane-quiz to the new onCommit-first API (while keeping a compatibility shim for other editors)
- Confirm plane-quiz AppData type structure (or share the existing type snippet if you have it handy)
- Confirm the exact trigger you want for onCommit in plane-quiz (blur vs explicit commit action)
- Confirm whether you want me to also draft the two files (Project context document and Current plan document) as actual text you can save, or prefer I output them inline in this chat for you to copy

If you approve, the next turn I’ll present:
- A precise, execution-ready migration plan (step-by-step with minimal changes)
- The two documentation files (project context and current plan) in full ready-to-save form
- A concrete outline of the exact code changes I would make for plane-quiz (without applying them yet, per plan constraints)

Reference notes from repository/docs
- The README notes plane-quiz as one of the six editors and describes the general editor architecture and data flow, including an example of using an onChange to update editor data and a separate path for transforms in main. This aligns with the plan to introduce an internal form state while preserving archival hooks.
- The FORM_LIBRARY_MIGRATION_PLAN.md you provided outlines a similar phased approach: introduce an EditorWrapper, migrate plane-quiz as the pilot, and then progressively migrate the rest while preserving the archive/change semantics.

Let me know your preferences on the API direction and the commit triggers, and I’ll lock in the plan and start preparing the documents.