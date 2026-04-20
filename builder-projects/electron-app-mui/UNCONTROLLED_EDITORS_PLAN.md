# Uncontrolled Editors Migration Plan

This document outlines the strategy for migrating the Minigame Builder's editors to an uncontrolled architecture using `@tanstack/react-form`.

## 1. Objectives
- **Performance**: Eliminate full-editor re-renders on every keystroke.
- **Maintainability**: Use a robust form library for complex nested data structures.
- **Type Safety**: Leverage TanStack Form's strong typing.
- **UX**: Retain synchronous "save-while-typing" and robust undo/redo integration.

## 2. Architecture Overview

### Current (Controlled)
- `ProjectPage` passes `appData` and `onChange` to `Editor`.
- `Editor` is a controlled component.
- Any change in any field triggers `onChange`, updating `ProjectPage` state, and re-rendering the entire `Editor` tree.

### Proposed (Uncontrolled)
- `ProjectPage` creates a `form` instance via a hook.
- `Editor` receives the `form` instance as a prop.
- `Editor` uses `TanStack Form` components (`form.Field`, `withForm`, etc.) to bind fields.
- `ProjectPage` pulls data from the form via `form.state.values` for saving and auto-saving.
- `ProjectPage` resets the form via `form.reset(newData)` for undo/redo operations.

## 3. Infrastructure Changes

### 3.1. Install Dependency
Add `@tanstack/react-form` to the project.

### 3.2. Registry Update (`src/renderer/src/games/registry.ts`)
Update `GameRegistryEntry` to support the new `form` prop.

```tsx
export interface GameRegistryEntry {
  // New Editor signature
  Editor: ComponentType<{
    form: any // Strongly typed in implementation
    projectDir: string
    onCommit?: (data: AnyAppData) => void // Trigger history snapshot
  }>
  createInitialData: () => AnyAppData
}
```

### 3.3. ProjectPage Updates (`src/renderer/src/pages/ProjectPage.tsx`)
- Implement a generic hook (or a factory) to manage the form instance.
- Synchronize form state with `useProjectHistory`.
- Update auto-save logic to pull from `form.state.values`.

## 4. Migration Roadmap (Per Editor)

To avoid build errors, we will systematically "disable" (comment out) editors in the registry and migrate them one by one.

### Phase 1: Infrastructure & Template (Whack-A-Mole)
1. Install `@tanstack/react-form`.
2. Implement `useEditorForm` utility hook.
3. Update `ProjectPage` to support the new API.
4. Migrate `WhackAMoleEditor`. This will serve as the template for others.

### Phase 2: Simple Editors
- `Plane Quiz`
- `Word Search`
- `Balloon Letter Picker`

### Phase 3: Complex Editors
- `Group Sort` (Complex nested items & groups)
- `Pair Matching`
- `Labelled Diagram` (Canvas interaction + points)
- `Find the Treasure`
- `Jumping Frog`

## 5. Per-Editor Implementation Details

For each editor:
1. Define the `AppData` schema clearly (already in `shared/types.ts`).
2. Wrap the editor with `withForm`.
3. Use `form.Field` for top-level fields (e.g., `title`, `grade`).
4. For lists (e.g., `questions`, `items`), use `form.Field` with array paths or `withFieldGroup`.
5. Replace internal CRUD logic to use `form.pushValue`, `form.setFieldValue`, etc.
6. Ensure `onCommit` is called for operations that should create a history entry (e.g., adding/deleting an item, or on blur for text fields).

## 6. ProjectPage API Changes (Detailed)

```tsx
function ProjectPageInner(...) {
  const { present: appData, setPresent, ... } = useProjectHistory()
  
  // Create form instance
  const form = useForm({
    defaultValues: appData,
  })

  // Sync back from history (Undo/Redo)
  useEffect(() => {
    form.reset(appData)
  }, [appData])

  // handleCommit: Manual trigger for history entry
  const handleCommit = useCallback((data: AnyAppData) => {
    setPresent(data)
    setIsDirty(true)
  }, [setPresent])

  // handleSave: Pull current state from form
  const handleSave = async () => {
    const currentData = form.state.values
    await doSave(meta, currentData)
  }

  // ...
  return <Editor form={form} projectDir={meta.projectDir} onCommit={handleCommit} />
}
```
