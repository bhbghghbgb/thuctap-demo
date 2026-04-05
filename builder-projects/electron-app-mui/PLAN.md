# Migration Plan: GroupSortEditor to TanStack Form (Uncontrolled API)

## Overview

This document details the plan for migrating the GroupSort editor from the current **controlled** pattern (every keystroke calls `onChange`, causing full re-renders through ProjectPage) to an **uncontrolled** pattern using TanStack Form, where the editor owns its intermediate state and only commits to the parent when explicitly requested.

---

## 1. Problem Statement

**Current flow (controlled):**
```
User types → onChange(newData) → ProjectPage.setPresent(newData) → Re-render entire editor
```
- Every keystroke on every text field triggers a full re-render of the entire editor
- The ProjectPage archives a history state on EVERY change (expensive)
- Editors have no control over when to commit

**Target flow (uncontrolled with deferred commit):**
```
User types → TanStack Form stores value locally → No parent re-render
User blur / Parent calls commit → onCommit(finalData) → ProjectPage archives ONE history state
```
- Editors manage their own intermediate state via TanStack Form
- `onCommit` is called by the editor when it wants to archive (on blur, on explicit commit request)
- Parent can imperatively `getValue()` (for save/undo/redo) and `setValue()` (for undo/redo reset)

---

## 2. New API Contract

### 2.1 Editor Props (what the editor RECEIVES)

```typescript
interface EditorProps {
  initialValue: GroupSortAppData   // Strictly initial - only used on first render
  projectDir: string               // Unchanged
  onCommit: (data: GroupSortAppData) => void  // Editor calls this to archive history
}
```

### 2.2 Imperative Handle (what the parent CAN CALL)

```typescript
export interface EditorHandle {
  getValue: () => GroupSortAppData  // Get current state immediately (for save/undo)
  setValue: (data: GroupSortAppData) => void  // Reset to new state (for undo/redo)
}
```

### 2.3 How It Works in Practice

| Action | What happens |
|--------|-------------|
| **User types in a text field** | TanStack Form stores the value internally. No `onCommit` called. No parent re-render. |
| **User blurs a text field** | Editor's field calls `onCommit` with the current form state. ProjectPage archives history. |
| **User clicks "Add Group"** | Editor's form pushes a new group entry. Editor calls `onCommit`. ProjectPage archives history. |
| **User presses Ctrl+Z (undo)** | 1. ProjectPage calls `editorRef.current.getValue()` to archive current state first. 2. ProjectPage calls `editorRef.current.setValue(previousState)` to reset editor. |
| **User presses Ctrl+S (save)** | ProjectPage calls `editorRef.current.getValue()` to get the latest state, then saves to disk. |
| **Project loads from disk** | `initialValue` prop changes. Editor's form resets to the loaded data (via `setValue` effect). |

---

## 3. TanStack Form Composition Strategy

### 3.1 Why TanStack Form?

- **Fully controlled under the hood** but the form instance manages its own store, so parent doesn't re-render on every field change
- **Selector-based subscriptions** via `useStore` means only the changed field re-renders, not the whole form
- **Form composition** via `createFormHook` lets us split the massive editor into smaller typed sub-components without prop drilling
- **Imperative API** (`form.state`, `form.setValue`, `form.reset`, `form.submit`) maps perfectly to our `getValue`/`setValue`/`onCommit` needs

### 3.2 Composition Pattern

The editor is too large to be a single flat form. It has 3 tabs, each with multiple cards, each with multiple fields. The strategy:

**Use `createFormHook` to bootstrap the form ecosystem, then use `withForm` for sub-components.**

```
GroupSortEditor (root form via useAppForm)
  ├── GroupsTab (receives form instance, uses form.AppField)
  │   └── GroupCard (withForm sub-component, receives form)
  │       ├── NameField (uses useFieldContext)
  │       └── ImagePicker (uses useFieldContext or uncontrolled with onBlur commit)
  ├── ItemsTab (same pattern)
  │   └── ItemCard (withForm sub-component)
  └── OverviewTab (same pattern, reuses GroupCard/ItemCard)
```

**Key decision: One form, not nested forms.**

We use a **single** `useAppForm` instance at the editor root, and pass it down to sub-components. Sub-components use `withForm` to get typed field access. This avoids the complexity of nested forms syncing state and keeps the imperative `getValue()` simple (one form.state.values to read).

### 3.3 Form Setup with createFormHook

```typescript
// src/renderer/src/games/group-sort/form.ts
import { createFormHookContexts, fieldComponents, formComponents } from '@renderer/components/FormFields'
import { GroupSortAppData } from '../../types'

// Create the custom form ecosystem
const { fieldContext, formContext, useAppForm, withForm, withFieldGroup, AppForm, AppField } =
  createFormHookContexts()

// Export everything the editor needs
export { useAppForm, withForm, withFieldGroup, fieldContext, formContext, AppForm, AppField }

// Form options helper for consistent typing
export const groupSortFormOptions = formOptions<GroupSortAppData>()
```

Wait — looking at the project, there are NO existing form field components set up for TanStack Form. The project doesn't have TanStack Form installed at all.

### 3.4 Revised Approach: useForm directly (simpler for migration)

Since the project doesn't have TanStack Form installed and doesn't have a pre-built `createFormHook` setup, we should start with the basic `useForm` API and wrap it. Setting up the full `createFormHook` ecosystem is overkill for a single editor experiment.

**Simpler approach for the experiment:**

```typescript
// In GroupSortEditor
const form = useForm({
  defaultValues: initialValue,
  // No onChange, no onSubmit - we manage commits manually
})

// Expose imperative handle
useImperativeHandle(ref, () => ({
  getValue: () => form.state.values,
  setValue: (data) => form.reset(data)
}))

// Pass form to sub-components via context or prop
```

Sub-components use `form.Field` to create fields and bind to `value`/`onChange`/`onBlur`. On `onBlur`, we trigger `onCommit(form.state.values)`.

### 3.5 Array Fields

TanStack Form supports `mode: 'array'` for array fields. This is perfect for the `groups` and `items` arrays:

```typescript
<form.Field
  name="groups"
  mode="array"
  children={(field) => {
    // field.state.value is the groups array
    // field.pushValue(newGroup) to add
    // field.removeValue(index) to delete
    // field.setValue(index, updatedGroup) to update
  }}
/>
```

---

## 4. Detailed File Changes

### 4.1 Install TanStack Form

```bash
yarn add @tanstack/react-form
```

### 4.2 Files to Comment Out (other editors in registry)

**File:** `src/renderer/src/games/registry.ts`

Comment out all editor registrations EXCEPT `group-sort`:

```typescript
export const GAME_REGISTRY: Record<string, GameRegistryEntry> = {
  'group-sort': {
    Editor: GroupSortEditor as GameRegistryEntry['Editor'],
    createInitialData: () => ({ ... })
  },
  // 'plane-quiz': { ... },     // ← commented
  // 'balloon-letter-picker': { ... },  // ← commented
  // 'pair-matching': { ... },   // ← commented
  // 'word-search': { ... },     // ← commented
  // 'whack-a-mole': { ... },    // ← commented
}
```

### 4.3 Changes to ProjectPage.tsx

**Key changes:**
1. Change `handleAppDataChange` → `handleCommit` (no longer called on every keystroke)
2. Add `editorRef` to access imperative handle
3. Update undo/redo to use `getValue()` before `setValue()`
4. Update save to use `getValue()`
5. Pass `initialValue` instead of `appData` to the editor
6. Pass `onCommit` callback

**New rendering pattern:**

```typescript
// In ProjectPageInner
const editorRef = useRef<{ getValue: () => AnyAppData; setValue: (data: AnyAppData) => void }>(null)

// When undo is pressed:
const handleUndo = useCallback(() => {
  // Archive current state first
  const currentState = editorRef.current?.getValue() ?? appData
  setPresent(currentState)  // Push current to history
  historyUndo()             // Go back
  const previousState = /* read from history */
  editorRef.current?.setValue(previousState)
  setIsDirty(true)
}, [historyUndo, ...])

// When save is pressed:
const handleSave = useCallback(async () => {
  const currentData = editorRef.current?.getValue() ?? appData
  await doSave(meta, currentData)
  showSnack('Project saved!')
}, [meta, doSave, showSnack])

// Render editor with new props
<Editor
  ref={editorRef}
  initialValue={appData}
  projectDir={meta.projectDir}
  onCommit={handleCommit}
/>

const handleCommit = useCallback((newData: AnyAppData) => {
  setPresent(newData)
  setIsDirty(true)
  appDataRef.current = newData
  isDirtyRef.current = true
  // auto-save logic if on-edit mode
}, [setPresent, resolved.autoSave.mode, doSave])
```

### 4.4 Changes to GroupSortEditor.tsx

**Complete rewrite of the component structure:**

```typescript
import { useForm, useStore } from '@tanstack/react-form'
import type { GroupSortAppData } from '../../types'

interface Props {
  initialValue: GroupSortAppData
  projectDir: string
  onCommit: (data: GroupSortAppData) => void
}

export interface GroupSortEditorHandle {
  getValue: () => GroupSortAppData
  setValue: (data: GroupSortAppData) => void
}

export const GroupSortEditor = forwardRef<GroupSortEditorHandle, Props>(
  ({ initialValue, projectDir, onCommit }, ref) => {
    const form = useForm<GroupSortAppData>({
      defaultValues: normalize(initialValue),
      // No onSubmit - we commit manually
    })

    // Sync when initialValue changes (project load)
    useEffect(() => {
      form.reset(normalize(initialValue))
    }, [initialValue])

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      getValue: () => form.state.values,
      setValue: (data) => form.reset(data)
    }))

    // Commit helper - called on blur or explicit commit
    const commit = useCallback(() => {
      onCommit(form.state.values)
    }, [form.state.values, onCommit])

    // Tab state (local UI state, unchanged)
    const [tab, setTab] = useState<Tab>('groups')

    // Keyboard shortcuts - now call form array helpers + commit
    useEntityCreateShortcut({
      onTier1: () => {
        form.pushValue('items', createDefaultItem())
        commit()
      },
      onTier2: () => {
        form.pushValue('groups', createDefaultGroup())
        commit()
      }
    })

    return (
      <Box>
        {/* Sidebar - unchanged, uses form state via subscriptions */}
        <Sidebar />

        {/* Main content */}
        <Box>
          {tab === 'groups' && <GroupsTab form={form} projectDir={projectDir} onCommit={commit} />}
          {tab === 'items' && <ItemsTab form={form} projectDir={projectDir} onCommit={commit} />}
          {tab === 'overview' && <OverviewTab form={form} projectDir={projectDir} onCommit={commit} />}
        </Box>
      </Box>
    )
  }
)
```

### 4.5 Changes to GroupSortTabs.tsx and Card Components

**GroupsTab, ItemsTab, OverviewTab** no longer receive `groups`, `items`, `onUpdate`, `onDelete` etc. Instead they receive the `form` instance and `onCommit`:

```typescript
interface GroupsTabProps {
  form: FormApi<GroupSortAppData>
  projectDir: string
  onCommit: () => void
}

export function GroupsTab({ form, projectDir, onCommit }: GroupsTabProps) {
  return (
    <form.Field name="groups" mode="array">
      {(field) => {
        const groups = field.state.value
        return (
          <Box>
            <StickyHeader ... />
            {groups.length === 0 ? (
              <EmptyState ... />
            ) : (
              groups.map((g, idx) => (
                <GroupCard
                  key={g.id}
                  form={form}
                  groupIndex={idx}
                  projectDir={projectDir}
                  onCommit={onCommit}
                />
              ))
            )}
          </Box>
        )
      }}
    </form.Field>
  )
}
```

**GroupCard** uses `form.Field` for each editable field:

```typescript
interface GroupCardProps {
  form: FormApi<GroupSortAppData>
  groupIndex: number
  projectDir: string
  onCommit: () => void
}

export function GroupCard({ form, groupIndex, projectDir, onCommit }: GroupCardProps) {
  return (
    <FileDropTarget onFileDrop={async (fp) => {
      const rel = await window.electronAPI.importImage(fp, projectDir, /* need id */)
      form.setFieldValue(`groups[${groupIndex}].imagePath`, rel)
      onCommit()
    }}>
      <Paper>
        {/* Image field */}
        <form.Field name={`groups[${groupIndex}].imagePath`}>
          {(field) => (
            <ImagePicker
              projectDir={projectDir}
              value={field.state.value}
              onChange={(p) => field.handleChange(p)}
              onBlur={() => onCommit()}
            />
          )}
        </form.Field>

        {/* Name field */}
        <form.Field name={`groups[${groupIndex}].name`}>
          {(field) => (
            <NameField
              value={field.state.value}
              onChange={(v) => field.handleChange(v)}
              onBlur={() => onCommit()}
            />
          )}
        </form.Field>

        {/* Delete button */}
        <IconButton onClick={() => {
          form.removeFieldValue('groups', groupIndex)
          onCommit()
        }}>
          <DeleteIcon />
        </IconButton>
      </Paper>
    </FileDropTarget>
  )
}
```

**Key behavioral changes in sub-components:**
- `onUpdate(id, patch)` → `form.setFieldValue(\`groups[${index}].name\`, value)` + `onCommit()`
- `onDelete(id)` → `form.removeFieldValue('groups', index)` + `onCommit()`
- `onAdd()` → `form.pushValue('groups', newGroup)` + `onCommit()`
- Text/image field changes still update the form store immediately, but `onCommit` only fires on **blur** or **explicit action** (add/delete)

### 4.6 Handling the OverviewTab

OverviewTab is the most complex because it shows groups AND items together, plus cross-references. It needs:

```typescript
<form.Field name="groups" mode="array">
  {(groupsField) => (
    <form.Field name="items" mode="array">
      {(itemsField) => {
        const groups = groupsField.state.value
        const items = itemsField.state.value
        // Render combined view, same structure as before
        // All mutations go through form.setFieldValue / form.pushValue / form.removeFieldValue
      }}
    </form.Field>
  )}
</form.Field>
```

Or simpler: use `useStore` selectors to read both arrays without nesting:

```typescript
const groups = useStore(form.store, (s) => s.values.groups)
const items = useStore(form.store, (s) => s.values.items)
```

This is cleaner and avoids deep nesting.

---

## 5. How the System Works After Migration

### 5.1 User Flow: Typing in a Text Field

```
1. User clicks on a Group name text field
2. User types "Animals"
   - TanStack Form updates groups[0].name internally
   - NO onCommit fired during typing
   - NO ProjectPage re-render
   - Only the NameField component re-renders (selector subscription)
3. User clicks away (blur)
   - NameField fires onBlur → onCommit()
   - onCommit calls form.state.values → passes full GroupSortAppData to ProjectPage
   - ProjectPage.setPresent(newData) → archives history state
   - ProjectPage sets dirty = true
```

### 5.2 User Flow: Undo (Ctrl+Z)

```
1. User presses Ctrl+Z
2. ProjectPage.handleUndo:
   a. Calls editorRef.current.getValue() → gets current editor state
   b. Calls setPresent(currentState) → pushes current to history stack
   c. Calls historyUndo() → travels back in history
   d. Reads previous state from history
   e. Calls editorRef.current.setValue(previousState)
3. Editor receives setValue(data):
   - Calls form.reset(data)
   - All fields instantly update to the previous state values
```

### 5.3 User Flow: Save (Ctrl+S)

```
1. User presses Ctrl+S
2. ProjectPage.handleSave:
   a. Calls editorRef.current.getValue() → gets latest state (even if user is mid-typing)
   b. Calls doSave(meta, latestData)
   c. Saves to disk
```

### 5.4 User Flow: Project Load

```
1. User opens a project file
2. ProjectHistoryProvider loads appData
3. ProjectPage passes appData as initialValue to editor
4. Editor's useEffect detects initialValue change
5. Editor calls form.reset(normalize(initialValue))
6. All fields populate with loaded data
```

---

## 6. Performance Improvements

| Metric | Before | After |
|--------|--------|-------|
| Re-renders per keystroke | Entire editor tree (all tabs, all cards) | Only the single field component |
| History entries per keystroke | 1 per keystroke | 1 per blur/action |
| Undo/redo cost | Free (already in history) | getValue() is a simple object read |
| Memory | History grows fast | History grows slower (fewer commits) |

---

## 7. Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| **TanStack Form array field API might not match our dynamic CRUD patterns** | The experiment will reveal this. If `pushValue`/`removeFieldValue` are too limited, we can use `form.setFieldValue('groups', newArray)` with immer-style updates |
| **onCommit timing: user might blur without intending to commit** | This is actually desired behavior - blur IS a natural commit point. If needed, we can debounce blur commits |
| **Form reset on project load might lose unsaved changes** | The parent controls when setValue is called, so this is intentional. User must save before switching projects |
| **Other editors commented out breaks the app for non-group-sort projects** | This is temporary for the experiment. We'll uncomment after validating the approach |
| **TanStack Form not installed** | Need to `yarn add @tanstack/react-form` first |

---

## 8. Step-by-Step Implementation Order

1. **Install TanStack Form**: `yarn add @tanstack/react-form`
2. **Comment out other editors** in `registry.ts`
3. **Update ProjectPage.tsx**:
   - Add `editorRef`
   - Change `handleAppDataChange` → `handleCommit`
   - Update undo/redo/save to use `getValue()`/`setValue()`
   - Change editor props to `initialValue`, `onCommit`
4. **Rewrite GroupSortEditor.tsx**:
   - Change props interface
   - Set up `useForm` with `defaultValues`
   - Add `forwardRef` with `useImperativeHandle`
   - Add `useEffect` for `initialValue` sync
   - Replace `onChange` calls with form mutations + `onCommit`
5. **Update GroupSortTabs.tsx**:
   - Change props to accept `form` instance
   - Use `form.Field` or `useStore` for reading state
   - Use `form.pushValue`/`form.removeFieldValue`/`form.setFieldValue` for mutations
6. **Update GroupCard.tsx and ItemCard.tsx**:
   - Accept `form` and field path/index
   - Wrap fields with `form.Field`
   - Bind `value`/`onChange`/`onBlur` to form field API
   - `onBlur` triggers `onCommit`
7. **Test thoroughly**:
   - Typing doesn't cause full re-renders
   - Blur commits to history
   - Undo/redo works correctly
   - Save gets latest state
   - Project load populates form correctly
8. **Verify type checking passes**: `yarn typecheck`

---

## 9. What This Experiment Proves

If successful, this pattern can be applied to all other editors:
- **Generic wrapper**: We could create a `useEditorForm<T>(initialValue, onCommit)` hook that wraps the TanStack Form setup
- **Shared field components**: `NameField`, `ImagePicker` etc. could be wrapped with TanStack Form's field context for automatic blur-commit
- **Registry update**: The registry's Editor type would change to accept `initialValue`/`onCommit` and expose the imperative handle
