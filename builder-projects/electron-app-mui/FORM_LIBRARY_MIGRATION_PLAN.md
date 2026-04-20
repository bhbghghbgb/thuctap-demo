# Form Library Migration Plan

## Problem Analysis

### Current Architecture

**ProjectPage** (`pages/ProjectPage.tsx`):
- Uses `useProjectHistory` hook to manage undo/redo state
- Renders Editor with: `<Editor appData={appData} projectDir={meta.projectDir} onChange={handleAppDataChange} />`
- `handleAppDataChange` calls `setPresent(newData)` to update history state on every change

**Current Editor API** (`games/registry.ts:25-34`):
```typescript
interface Props {
  appData: AnyAppData      // Current project data
  projectDir: string      // Project directory for image imports
  onChange: (data: AnyAppData) => void  // Called on EVERY change
}
```

### The Problem

Every keystroke triggers:
1. `NameField.onChange(e.target.value)` (line 48 in NameField.tsx)
2. Propagates up through component tree
3. Each change creates a **new immutable copy** of entire appData
4. Calls `onChange(newData)` → `setPresent(newData)` → **full Editor re-render**

This causes performance issues with many text fields.

---

## Proposed Solution

### New Editor API

```typescript
interface EditorRef {
  getValue(): AnyAppData    // Synchronous get - even if field is focused
  setValue(data: AnyAppData): void  // Reset form to specific value (undo)
}

interface Props {
  initialData: AnyAppData   // Only for initial load (project open)
  projectDir: string
  setValue?: (fn: () => AnyAppData) => void  // Parent provides callback to get current value
  getValue?: (fn: (get: () => AnyAppData) => void) => void  // Parent registers getter
  onCommit: (data: AnyAppData) => void  // Called when user explicitly commits (blur, save, etc.)
}
```

### Implementation Strategy

1. **Wrapper Component**: Create a backward-compatible wrapper that:
   - Accepts old API (`appData`, `onChange`)
   - Internally uses new API (`initialData`, `setValue`, `getValue`, `onCommit`)
   - Handles the conversion between old and new patterns

2. **Form Library**: Use **React Hook Form** because:
   - Works with uncontrolled components (ref-based)
   - Has `useForm` with `reset` for setValue
   - Has `formState` for tracking dirty state
   - Minimal re-renders

3. **useImperativeHandle**: Expose `getValue` and `setValue` to parent without re-rendering child

---

## Migration Steps

### Phase 1: Infrastructure (Wrapper + Types)

1. Create `EditorWrapper.tsx` that:
   - Accepts old API props
   - Uses `useImperativeHandle` internally to expose getValue/setValue
   - Manages the "pending commits" logic

2. Update `GameRegistryEntry` type to support both APIs

3. Keep all existing Editors working with old API via wrapper

### Phase 2: Migrate One Editor (Pilot)

**Recommendation: Start with `plane-quiz` (QuizEditor)**

Reasons:
- Has text fields (QuestionCard, AnswerList) that trigger onChange on every keystroke
- Moderate complexity - not too simple (won't show the problem) nor too complex
- Clear commit points: blur from text field should commit
- When user clicks undo/save while typing, need to capture current state

Changes to QuizEditor:
1. Use React Hook Form with `useForm<QuizAppData>`
2. Call `onCommit` on text field blur
3. Expose `getValue()` and `setValue()` via `useImperativeHandle`
4. Rename `onChange` prop to `onCommit`

### Phase 3: Update ProjectPage

1. Update Editor rendering to:
   - Pass `initialData` (only on first load)
   - Use ref to call `getValue()` synchronously when user clicks Save/Undo
   - Pass `setValue` callback for undo operations

2. Handle the case where user types but hasn't blurred:
   - On Save: call `getValue()` to get current form state before saving
   - On Undo: call `getValue()` to capture current state to history, then `setValue()` with history value

### Phase 4: Migrate Remaining Editors

Repeat for each editor:
- `group-sort`
- `balloon-letter-picker`
- `pair-matching`
- `word-search`
- `whack-a-mole`
- `labelled-diagram`
- `find-the-treasure`
- `jumping-frog`

---

## Key Technical Decisions

### 1. When to Commit?

Options:
- **On blur**: Good for history (every field change is captured)
- **On explicit action** (Save button): Better performance, but loses intermediate states
- **Hybrid**: Commit on blur, but also have "draft" state for undo

**Recommendation**: Commit on blur for most fields. For undo/save operations, always call `getValue()` first to capture any uncommitted changes.

### 2. Handling Undo While Typing

When user presses Ctrl+Z while focused on a text field:
1. Parent calls `getValue()` to capture current (unblurred) state to history
2. Parent calls `setValue(historyPreviousState)` to reset form
3. Editor updates its internal form state

### 3. Backward Compatibility

The wrapper should:
- Accept both old and new API props
- Log deprecation warnings for old API usage
- Provide migration path for each editor

---

## File Changes Summary

### New Files
- `src/renderer/src/components/EditorWrapper.tsx` - Backward-compatible wrapper

### Modified Files
- `src/renderer/src/games/registry.ts` - Update GameRegistryEntry type
- `src/renderer/src/pages/ProjectPage.tsx` - Use new Editor API
- Individual Editor files (one at a time)

---

## Open Questions for Discussion

1. Should the form library track "dirty" state? (i.e., only commit if actually changed)
2. How to handle validation errors? (currently some fields have `required` flag)
3. Should each Editor use RHF directly, or share a common hook?
4. What's the expected behavior for auto-save while typing?

---

## Next Steps

1. Review this plan
2. Confirm starting editor (recommend `plane-quiz`)
3. Create the EditorWrapper infrastructure
4. Begin Phase 2 (pilot migration)
