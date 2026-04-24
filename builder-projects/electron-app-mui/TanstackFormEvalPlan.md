Here’s a concise evaluation of TanStack Form documentation focused on form composition, with concrete takeaways you can map to your Editor migration plan. I pulled the core patterns from the Form Composition page you highlighted, plus related sections surfaced by the docs (via the sidebar patterns like withForm, withFieldGroup, AppField, etc.). I’ve also included how each pattern could fit your Plane-Quiz migration and broader editor strategy.

What I found about TanStack Form patterns (summary)

- Core pattern: per-editor form via custom hooks
  - Create a per-editor form hook with createFormHook, yielding useAppForm and optional form components.
  - This pattern is ideal for isolating editor state, avoiding parent re-renders, and giving editors a dedicated form instance.
  - Evidence: Form Composition page shows useAppForm and the concept of custom form hooks as the primary, scalable approach. It also demonstrates building custom UI components that consume form context (AppField, field components).
- Composition via withForm (and withFieldGroup)
  - withForm lets you compose forms by injecting a sub-form pattern into an existing form object, enabling reuse and modularization without duplicating boilerplate.
  - withFieldGroup enables grouping related fields that can be embedded into multiple forms, improving reuse of common field logic.
  - This is particularly valuable when you have multi-part editors or nested forms (e.g., a plane-quiz with nested questions/answers).
- Pre-bound field components and AppField
  - Pre-bound field components allow you to reuse common UI primitives bound to your form state (e.g., a TextField component driven by a field context).
  - AppField provides a higher-level abstraction to bind fields to the form without writing boilerplate for every editor.
  - Useful for reducing boilerplate across many editors that share similar field types (text, numbers, selects, etc.).
- Breaking big forms into smaller pieces
  - Form composition supports splitting large editors into smaller components using withForm and related patterns.
  - This aligns with your goal of making editors more modular and easier to migrate piece by piece.
- Tree-shaking form and field components
  - TanStack Form supports lazy loading of form components to reduce bundle size, which is important if you migrate many editors.
  - This helps keep the initial load light while still enabling per-editor forms.
- Context as a last resort
  - There is a form-context pattern for cases where you can’t pass form props directly, though this is more of a bridge than a preferred pattern.
  - Use only when you’re constrained by integration boundaries.
- Putting it all together
  - The docs show a cohesive pattern: useAppForm to create a per-editor form, AppField and form fields to render UI, withOptional withForm/withFieldGroup for composition, and onBlur/onSubmit strategies to commit changes.
  - The API usage chart at the end reinforces the recommended pattern (custom form hooks + AppField/AppField components + withForm for composition).

How these patterns map to your Builder project

- Current state recap
  - Editors are wrapped by wrapEditor.tsx, with EditorWrapper handling local state to avoid re-renders and onChange forwarding to onCommit.
  - Plane-Quiz (QuizEditor) is currently wrapped, and the registry mounts editors via wrapEditor.
  - The goal is to migrate editors to a TanStack Form-based approach, hosting a per-editor form, and pushing commits as immutable data copies.
- Desired benefits
  - Reduced re-renders by isolating editor state in per-editor forms.
  - Cleaner data flow: editors own their form state and commit changes as immutable objects.
  - Easier migration path for other editors by copying the same per-editor form pattern (thanks to withForm and AppField patterns).
- Key architectural insight from the docs
  - The recommended pattern for multi-editor apps is to treat each editor as a small, self-contained form module (useAppForm + AppField + withForm) rather than having the parent manage editor state.
  - This aligns with your constraint to not mutate history directly in editors and to preserve immutable commits.

Recommended approach for Plane-Quiz (first editor)

- Use a per-editor custom form hook
  - Create a QuizFormEditor (replacing or coexisting with current QuizEditor)
  - Initialize a per-editor form using useAppForm with defaultValues equal to the initialData passed to the editor.
  - Build the UI using AppField and field components bound to the form.
  - Implement onBlur-based commit: when a text field loses focus, generate a new immutable data object from the current form values and call onCommit(newData).
  - Expose getValue and setValue on a small ref wrapper around the per-editor form (to satisfy existing EditorWrapper expectations during migration).
- Use withForm if Plane-Quiz has nested structures
  - If questions/answers are a nested structure, you can wrap a sub-form with withForm and compose nested form fragments (e.g., a child form for each question).
- Plan for incremental migration
  - Phase 1: Plane-Quiz migrated to a per-editor form using useAppForm + AppField; implement getValue/setValue via a small adapter; commit on blur.
  - Phase 2: Apply the same pattern to one more editor (e.g., Word Search) to validate the approach and determine boilerplate cost.
  - Phase 3: Introduce a lightweight shared helper (FormDrivenEditor) to reduce boilerplate across editors, then start migrating all editors in sequence.
  - Phase 4: Remove wrapEditor wrapper after all editors are migrated and adjust GAME_REGISTRY to reference migrated Editor components directly.

Concrete actions you can take next

- Decide on the exact TanStack Form package version to pin (v1 in docs you pulled suggests the v1 API surface; confirm the target version in your monorepo).
- Plan a small migration branch for Plane-Quiz:
  - Implement QuizFormEditor.tsx using useAppForm, AppField, and withForm where helpful.
  - Ensure the editor supports:
    - getValue(): T (read current form values)
    - setValue(data: T): void (replace form values)
    - onCommit: called with a fresh data object on blur or explicit save
    - non-blocking error visuals (visual-only)
- Provide a minimal adapter to keep compatibility with the existing EditorWrapper API until you fully remove the wrapper.
- Create a short docs note for the team summarizing:
  - The per-editor form pattern
  - How to copy-paste the pattern for other editors
  - How to handle getValue/setValue/onCommit in the new API

Would you like me to proceed with an initial code patch implementing Plane-Quiz as a TanStack Form-based editor (QuizFormEditor) and a small FormDrivenEditor helper to standardize the API (getValue/setValue/onCommit)? If yes, I’ll draft the patch set and outline the exact file changes, including how to wire it into GAME_REGISTRY and how to remove wrapEditor in a follow-up. If you prefer, I can first provide a more detailed mapping of concrete code shapes (snippets) before starting patches.
