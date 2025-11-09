# Code Review: PR #16 - "change(Panel): Change API"

## Overview

This PR represents a **major architectural refactoring** that fundamentally changes the API design of the Panelist library. The changes move from a multi-context provider architecture to a unified hook-based API (`usePanelist`), simplifying the public API while consolidating logic into a single custom hook.

### Key Changes:

- **API redesign**: Renamed `PanelRenderer` → `PanelistRenderer`, `panelCoordinates` → `panels` prop
- **Architectural shift**: Replaced multiple context providers (GridConfig, DragState) with a single `usePanelist` hook
- **Direct DOM manipulation**: Ghost panel now uses direct DOM updates instead of React state for performance
- **New animation system**: Added snap-back animations and animation detection helpers
- **Enhanced testing**: Added comprehensive test coverage for animation and rearrangement logic

---

## Code Quality Analysis

### ✅ Strengths

1. **Performance optimizations**
   - Direct DOM manipulation in `usePanelist.ts:54-81` for ghost panel avoids re-renders during drag operations
   - Smart use of `useRef` for internal state that doesn't need to trigger renders
   - Proper memoization with `useMemo` for panel props (line 314-353)

2. **Well-tested**
   - New test files for `animation.test.ts` and enhanced `rearrangement.test.ts`
   - Good coverage of edge cases (floating point positions, large deltas, zero deltas)

3. **Clean separation of concerns**
   - Helper functions properly isolated (`animation.ts`, `rearrangement.ts`, `gridCalculations.ts`)
   - Clear separation between public API and internal implementation

4. **Documentation**
   - Bilingual comments (English/Japanese) in rearrangement logic
   - Clear JSDoc comments for helper functions

### ⚠️ Issues & Concerns

#### 1. **Breaking API Changes** (Critical)

The PR introduces multiple breaking changes without migration documentation:

```diff
- <PanelRenderer itemRenderer={PanelContent} />
+ <PanelistRenderer itemRenderer={PanelContent} />

- panelCoordinates={[...]}
+ panels={[...]}
```

**Recommendation**: Add a CHANGELOG.md or migration guide documenting all breaking changes.

#### 2. **Type Safety Concerns**

**Issue in `demo/App.tsx:44`**:

```typescript
function PanelContent({ id }: { id: PanelId }) {
```

The `itemRenderer` prop type changed from `(id: PanelId) => ReactNode` to `React.ComponentType<{ id: PanelId }>`. This is inconsistent with the old API where it was a simple function.

**Recommendation**: Verify this is intentional and document the breaking change clearly.

#### 3. **Missing Error Handling**

**In `usePanelist.ts:163-164`**:

```typescript
const droppedLeft = Number(draggingElement.style.left.replace("px", ""));
const droppedTop = Number(draggingElement.style.top.replace("px", ""));
```

If the style values aren't in pixels (or are empty), this will produce `NaN`.

**Recommendation**:

```typescript
const droppedLeft = parseFloat(draggingElement.style.left) || 0;
const droppedTop = parseFloat(draggingElement.style.top) || 0;
```

#### 4. **Memory Leak Risk**

**In `usePanelist.ts:100-103`**:

```typescript
setTimeout(() => {
  internalState.animatingPanels.clear();
}, ANIMATION_DURATION);
```

If the component unmounts during animation, this timeout will still fire.

**Recommendation**:

```typescript
useEffect(() => {
  const timeoutIds = new Set<NodeJS.Timeout>();

  return () => {
    timeoutIds.forEach((id) => clearTimeout(id));
  };
}, []);

// Then store timeout IDs when creating them
const timeoutId = setTimeout(() => {
  internalState.animatingPanels.clear();
}, ANIMATION_DURATION);
timeoutIds.add(timeoutId);
```

#### 5. **Infinite Loop Risk**

**In `rearrangement.ts:224`**:

```typescript
for (let y = 0; ; y++) {  // Infinite loop!
```

This loop has no upper bound and will run forever if the grid is full.

**Recommendation**:

```typescript
const MAX_ROWS = 1000; // or calculate based on existing panels
for (let y = 0; y < MAX_ROWS; y++) {
  // ...
}
// After loop: throw error or return a default position
```

#### 6. **CSS Specificity Issues**

**In `demo/App.css:44-48`**:

```css
.panel-remove-button {
  background-color: transparent;
  &:hover {
    background-color: rgb(0 0 0 / 0.06);
  }
}
```

This overrides the general `button:hover` styles. Consider using more specific selectors or CSS modules to avoid conflicts.

#### 7. **Style Prop Mutation Concern**

**In `PanelistRenderer.tsx:35`**:

```typescript
opacity: baseSize ? 1 : 0,
```

The renderer is hidden until baseSize is calculated. This might cause a flash of empty content. Consider using a loading skeleton instead.

---

## Specific Suggestions

### 1. **Add TypeScript strict null checks**

Several places assume refs/elements exist without null checks:

```typescript
// usePanelist.ts:125
showGhostPanel(offsetX, offsetY, draggingElement.offsetWidth, draggingElement.offsetHeight);
```

Should be:

```typescript
if (draggingElement) {
  showGhostPanel(offsetX, offsetY, draggingElement.offsetWidth, draggingElement.offsetHeight);
}
```

### 2. **Export types for better DX**

**In `src/index.ts`** (not shown in diff):
Ensure all types are properly exported:

```typescript
export type { PanelCoordinate, PanelId } from "./types";
```

### 3. **Animation cleanup**

**In `animation.ts:21-33`**:
The animation sets styles but never cleans up. Consider returning a cleanup function:

```typescript
export function applySnapAnimation(options: ApplySnapAnimationOptions): () => void {
  // ... existing code ...

  return () => {
    element.style.transform = "";
    element.style.transition = originalTransition;
  };
}
```

### 4. **Accessibility concerns**

The resize handle (`<span className="resize-handle">`) has no accessible label or keyboard interaction. Consider:

```tsx
<span className="resize-handle" role="button" aria-label={`Resize panel ${key}`} tabIndex={0} {...resizeHandleProps} />
```

---

## Performance Implications

### ✅ Improvements

- Direct DOM manipulation for ghost panel reduces re-renders during drag
- Better memoization strategy
- Removed unnecessary context provider nesting

### ⚠️ Potential Issues

1. **useMemo dependencies** (`usePanelist.ts:344-353`): The dependencies array includes functions that may change on every render. Consider using `useCallback` for stability.

2. **Rearrangement algorithm**: The collision detection runs in O(n²) in worst case. For large panel counts (>100), consider spatial indexing (quadtree/grid).

---

## Security Considerations

### Low Risk

- No direct security vulnerabilities found
- No user input sanitization issues (IDs are system-generated)
- No XSS vectors identified

### Best Practices

- Consider validating panel coordinates to prevent negative values or values exceeding columnCount

---

## Test Coverage

### ✅ Well-tested

- Animation helpers have comprehensive tests
- Rearrangement logic has good coverage

### ❌ Missing tests

1. No tests for `usePanelist` hook
2. No integration tests for drag/resize behavior
3. No tests for `PanelistRenderer` component
4. No tests for the new `addPanel`/`removePanel` API

**Recommendation**: Add React Testing Library tests for the main hook and renderer component.

---

## Summary

| Aspect           | Rating     | Notes                                         |
| ---------------- | ---------- | --------------------------------------------- |
| Code Quality     | ⭐⭐⭐⭐   | Well-structured, but has some issues          |
| Performance      | ⭐⭐⭐⭐⭐ | Excellent optimizations                       |
| Test Coverage    | ⭐⭐⭐     | Good for helpers, missing for main components |
| Documentation    | ⭐⭐       | Missing migration guide                       |
| Breaking Changes | ⚠️         | Multiple breaking changes need documentation  |

### Action Items (Priority Order)

1. 🔴 **Critical**: Fix infinite loop in `findNewPositionToAddPanel` (src/helpers/rearrangement.ts:224)
2. 🔴 **Critical**: Add cleanup for setTimeout to prevent memory leaks (src/usePanelist.ts:100-103)
3. 🟡 **High**: Document breaking changes and provide migration guide
4. 🟡 **High**: Add error handling for style value parsing (src/usePanelist.ts:163-164)
5. 🟢 **Medium**: Add tests for `usePanelist` hook and `PanelistRenderer`
6. 🟢 **Medium**: Add accessibility attributes to resize handles
7. 🟢 **Low**: Consider adding loading skeleton instead of opacity transition

Overall, this is a solid refactoring with good architectural improvements, but it needs a few critical fixes before merging.
