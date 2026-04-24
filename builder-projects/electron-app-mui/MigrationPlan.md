# Migration Plan

Document purpose

- This document outlines the current context of the Builder project, the constraints around editor data flow, and a plan to migrate editors from the current wrapper-based approach to a TanStack Form-based approach for per-editor forms.
- The goal is to pick a versatile Form Composition pattern from TanStack Form docs, apply it to the Plane-Quiz editor first as an experiment, and provide a reusable pattern for the rest of the editors.

Context and key observations

- Project shape
  - The Builder hosts many Editor components; each Editor manages its own data independently (no shared state across editors).
  - The ProjectPage is responsible for history (undo/redo) and hosting the active Editor.
- Current API surface (legacy path)
  - Editors are wired via a wrapper that shims the old API.
  - wrapEditor.tsx is used as a shim to convert legacy Editor components into a consistent interface that the ProjectPage can work with.
  - The registry uses wrapEditor to expose an Editor for each game under GAME_REGISTRY (see registry.ts).
- Wrapper/adapter behavior (to inform migration)
  - wrapEditor.tsx provides a thin adapter:
    - It accepts an EditorComponent (legacy editor) and returns a component that supplies initialData, projectDir, and onCommit props.
    - It uses a hidden local state to hold the editor data to avoid re-rendering the parent on every keystroke.
  - EditorWrapper.tsx implements the runtime behavior:
    - It maintains localData in state and forwards onChange from the inner Editor to onCommit (so that history is updated without forcing a full parent re-render).
    - It exposes an imperative handle with getValue and setValue for external access.
    - The inner Editor receives appData (local copy) and onChange handler, along with projectDir.
  - Evidence in code:
    - wrapEditor.tsx shows the adapter: it forwards initialData, projectDir, and onCommit via EditorWrapper and uses forwardRef for EditorWrapperHandle (wraps EditorComponent) [wrapEditor.tsx lines 9-23].
    - EditorWrapper.tsx shows the localData pattern and how onChange is forwarded to onCommit while keeping local state [EditorWrapper.tsx lines 34-53].
    - registry.ts shows the editors being wrapped via wrapEditor for all games, e.g., Plane-Quiz is registered as Editor: wrapEditor(QuizEditor) [registry.ts lines 65-67].
- Editor implementations
  - Plane-Quiz (QuizEditor) uses LegacyEditorProps and onChange to propagate updates. The editor’s flow is currently tied to the onChange callback coming from the wrapper [QuizEditor.tsx lines 9-13, 23].
- API surface today
  - The Editor components expect props: appData, projectDir, onChange (via LegacyEditorProps).
  - The wrapper translates the onChange of the inner editor into a commit-style event, and the parent history captures that as a new immutable state.
- Documentation hints we can rely on for migration
  - TanStack Form (TanStack React Form) Form Composition patterns offer flexible, scalable ways to compose forms with nested fields.
  - The objective is to pick a pattern that is highly reusable across editors, so adding new editors later can copy the same pattern with minimal changes.

Problem statement for migration

- We want to migrate editors from using the wrapper/shim (which forwards onChange to onCommit and relies on local state to avoid re-renders) to a TanStack Form-driven approach:
  - Each Editor hosts a per-editor form object.
  - Editors use onBlur for text fields to push changes (instead of every keystroke) while still exposing a getValue/setValue/onCommit API surface.
  - The new pattern should be versatile enough for any Editor, not just Plane-Quiz, so other editors can copy-paste patterns with little adaptation.
- Constraints to respect
  - We must not mutate the history directly inside editors; a new immutable copy must be created and sent to parent via onCommit (as today).
  - Errors should be visual only; they should not block operations like getValue/setValue, commit, or submit.
  - The wrapper will be removed once the Editor migrates to the new API; during migration, it can be left as a shim, but the long-term plan is to remove it.

Proposed architecture: TanStack Form Composition pattern

- High-level idea
  - Each editor renders a per-editor TanStack Form (local to the editor) that owns its own values separate from the ProjectPage.
  - The editor will commit changes by creating a new immutable copy of the data and calling onCommit with that value.
  - Text fields use onBlur to update the form and then commit, aligning with the desire to avoid per-keystroke re-renders.
  - The Editor will still expose an imperative API (via a ref) with getValue and setValue to maintain compatibility with existing code paths.
- Why this pattern is versatile
  - It isolates editor state from the parent, reducing parent re-renders.
  - It supports complex editor data shapes by composing smaller form fields and nested structures.
  - It aligns well with a future where more editors can adopt a similar approach with minimal boilerplate.
  - TanStack Form supports controlled form state but with ergonomic patterns for complex forms; its Form Composition approach makes it easier to reuse across multiple editors.

API surface and data flow (new pattern)

- Editor component contract (per editor)
  - Props: appData (T), projectDir (string), onCommit (data: T) => void
  - Internally, the editor constructs a TanStack Form instance initialized with appData.
  - Form fields render controls bound to the form state.
  - On a blur event for text fields (or on explicit Save action), the editor:
    - Validates (visual-only errors)
    - Creates a new immutable copy of data reflecting the form’s current values
    - Calls onCommit(newData)
  - Imperative access (ref)
    - Expose getValue(): T that returns the current immutable data (from the form state)
    - Expose setValue(data: T): void that replaces the form values with data
- History/state management
  - The ProjectPage will receive onCommit updates, create a new history entry, and re-hydrate the Form if needed when reloading the editor (if applicable).
  - The immutable data flow is preserved: every commit creates a fresh data object.
- Error state behavior
  - Errors are purely visual; they do not block operations (commit remains allowed). Editors can display errors using the form’s validation state but should not prevent commit.

Migration plan: Plane-Quiz (first editor)

- Phase 1: Add a Form-based layer for Plane-Quiz
  - Create a Form-driven QuizEditor using TanStack Form:
    - Initialize a form with the initial data (questions array, etc.).
    - Bind UI components (inputs, selects, etc.) to form fields.
    - Implement onBlur handlers for text fields to trigger a commit with an updated immutable copy.
    - Implement getValue/setValue on a ref to expose to the outside world (for compatibility with existing code paths).
    - Keep onCommit semantics identical: commit must pass a new data object to the parent to update history.
    - Ensure error visuals are non-blocking (visual-only).
  - Remove wrapEditor shim usage for Plane-Quiz once the editor is fully migrated; for the migration window, you can use the shim as a temporary bridge if necessary.
- Phase 2: Propagate a reusable pattern
  - Introduce a small shared utility (optional but recommended) to reduce boilerplate for Form-driven editors:
    - A generic FormDrivenEditor that accepts a formConfig and a mapping to appData, providing getValue/setValue/onCommit.
    - This would let all editors copy a similar structure with minimal boilerplate.
  - Apply the FormDrivenEditor approach to the remaining editors (Group Sort, Balloon Letter Picker, Word Search, etc.) as successive experiments.
- Phase 3: Clean up
  - Remove wrapEditor.tsx wrapper once all editors are migrated to the new API.
  - Update GAME_REGISTRY to directly use the new Editor implementation (no wrapEditor wrapper) for migrated editors.
  - Ensure tests and manual QA cover the new form-based flow and that history commit semantics remain intact.

Concrete plan: quick execution steps

- Step 0: Confirm TanStack Form library choice
  - Decide on the exact TanStack Form package to use (e.g., @tanstack/react-form or the recommended package name at the time of migration).
  - Add the dependency to the project if not already present.
- Step 1: Implement a FormDrivenEditor helper (optional)
  - Create a new utility like FormDrivenEditor.tsx that encapsulates:
    - A per-editor form instance
    - getValue/setValue exposure via ref
    - A simple onBlur-to-commit pattern
  - This provides a minimal, repeatable base for all editors to adopt.
- Step 2: Migrate Plane-Quiz
  - Create PlaneQuizFormEditor.tsx (or refactor QuizEditor.tsx) to use TanStack Form for its internal state.
  - Bind fields (question/answers) to form controls.
  - Implement onBlur to trigger onCommit with a new data object.
  - Ensure onChange events still flow into the history (no regressions).
  - Update registry.ts to point to the new Editor (or continue to wrap during transition; plan to remove wrapEditor in a follow-up).
- Step 3: Validation
  - Run the app, exercise editing Plane-Quiz data, verify:
    - getValue and setValue work via the editor ref
    - onCommit is called with a new immutable object
    - History is updated
    - UI shows error visuals without blocking operations
- Step 4: Extend pattern to other editors
  - Migrate a second editor (e.g., Word Search or Whack-a-Mole) to the same pattern.
  - Use the same FormDrivenEditor helper where applicable.
- Step 5: Remove shim once all editors migrated
  - Remove wrapEditor.tsx usage entirely.
  - Clean up EditorWrapper usage if no longer needed.
  - Ensure GAME_REGISTRY only references migrated editor components directly.

Risks and mitigations

- Risk: The TanStack Form API surface differs from the assumptions in existing editors.
  - Mitigation: Start with Plane-Quiz as an experiment; keep a small adapter in place until the migration is stable.
- Risk: Overhead of introducing a new library in a codebase with performance sensitivity.
  - Mitigation: Profile after migrating Plane-Quiz; compare rendering behavior with the old approach; keep per-editor form instances lightweight.
- Risk: Breaking existing history semantics.
  - Mitigation: Ensure onCommit is still called with a fresh immutable object; unit tests should verify immutability and history entries.
- Risk: Documentation and onboarding burden for new pattern.
  - Mitigation: Provide a small FormDrivenEditor pattern guide and a shared utility to minimize boilerplate for other editors.

Appendix: suggested patch skeletons (high level)

- A. Shared Form-driven utility (optional)
  - Create a small FormDrivenEditor.tsx that exposes:
    - A React component wrapper that initializes a TanStack form with initialData
    - getValue/setValue via a ref
    - A standard onBlur handler factory to trigger onCommit with the form’s current data
- B. Plane-Quiz migration example (high level)
  - Replace QuizEditor with a Form-based implementation:
    - Import TanStack Form utilities
    - Initialize form with initialData
    - Bind inputs to form fields
    - On blur: form submission -> newData -> onCommit(newData)
    - Expose getValue/setValue via ref
- C. Registry updates (high level)
  - Keep Editor: wrapEditor(QuizEditorForm) during migration if desired
  - Eventually remove wrapEditor usage and export Editor directly (QuizEditorForm)

Notes on referencing TanStack Form docs

- The Form Composition page in TanStack Form docs shows patterns for composing complex forms with nested fields and reusable components.
- Look for patterns around:
  - Creating and wiring a form instance per editor
  - Binding inputs to form state
  - Handling onBlur vs onChange semantics
  - Exposing an imperative API (getValue/setValue) when needed
- A versatile approach is to implement a per-editor form context (or per-editor form instance) that can be composed with UI controls, allowing editors to be dropped in by copying a pattern rather than rearchitecting each editor.

What I need from you

- Approve that Plane-Quiz will be the first editor migrated to TanStack Form as described.
- Confirm the TanStack Form package to use (and whether you want me to add a small, reusable FormDrivenEditor helper to the codebase).
- If you’d like, I can proceed to draft and apply concrete code patches implementing Plane-Quiz Form-based editor and a minimal shared helper, then outline the follow-up migrations for the remaining editors.

Outcome

- A documented path to migrate editors to a versatile, per-editor form pattern using TanStack Form.
- A concrete plan to migrate Plane-Quiz first, with a reusable pattern that can be copied by other editors.
- Clear risks and mitigations to guide the transition with minimal disruption to existing functionality.
