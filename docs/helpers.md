# Helper Functions API Reference

PanelGrid exports low-level helper functions that provide access to the same collision detection, grid calculations, and animation systems used internally by the library. These utilities enable you to build sophisticated custom rearrangement logic tailored to your specific needs.

## Table of Contents

- [Installation](#installation)
- [Collision Detection](#collision-detection)
- [Rearrangement](#rearrangement)
- [Grid Calculations](#grid-calculations)
- [Panel Detection](#panel-detection)
- [Animation](#animation)
- [Advanced Examples](#advanced-examples)

## Installation

Import helper functions from the `panelgrid/helpers` subpath:

```tsx
import {
  // Collision detection
  detectCollisions,
  hasCollision,
  rectanglesOverlap,

  // Rearrangement
  rearrangePanels,
  findNewPosition,

  // Grid calculations
  snapToGrid,
  gridToPixels,
  pixelsToGridPosition,
  gridPositionToPixels,
  pixelsToGridSize,

  // Panel detection
  detectAnimatingPanels,

  // Animation
  applySnapAnimation
} from 'panelgrid/helpers';
```

## Collision Detection

Helper functions for detecting overlaps and collisions between panels.

### `detectCollisions`

Returns IDs of all panels that collide with the given panel.

```typescript
function detectCollisions(
  panel: PanelCoordinate,
  panelMap: Map<PanelId, PanelCoordinate>
): PanelId[];
```

**Parameters:**
- `panel` - The panel to test for collisions
- `panelMap` - Map of panel IDs to panel coordinates

**Returns:** Array of panel IDs that collide with the input panel

**Example:**

```tsx
import { detectCollisions } from 'panelgrid/helpers';
import type { PanelCoordinate, PanelId } from 'panelgrid';

const movingPanel: PanelCoordinate = { id: 'panel-1', x: 0, y: 0, w: 2, h: 2 };

// Create a map of panels
const panelMap = new Map<PanelId, PanelCoordinate>([
  ['panel-2', { id: 'panel-2', x: 1, y: 1, w: 2, h: 2 }], // Overlaps
  ['panel-3', { id: 'panel-3', x: 5, y: 0, w: 1, h: 1 }], // No overlap
]);

const collidingIds = detectCollisions(movingPanel, panelMap);
// Returns: ['panel-2']
```

### `hasCollision`

Checks if a candidate position collides with any panels, excluding a specific panel ID.

```typescript
function hasCollision(
  candidate: { x: number; y: number; w: number; h: number },
  excludeId: PanelId,
  panelMap: Map<PanelId, PanelCoordinate>
): boolean;
```

**Parameters:**
- `candidate` - The candidate position/size to test
- `excludeId` - Panel ID to exclude from collision check (typically the moving panel's ID)
- `panelMap` - Map of panel IDs to panel coordinates

**Returns:** `true` if the candidate collides with any panel (except excludeId), `false` otherwise

**Example:**

```tsx
import { hasCollision } from 'panelgrid/helpers';
import type { PanelId, PanelCoordinate } from 'panelgrid';

const candidate = { x: 1, y: 1, w: 2, h: 2 };

const panelMap = new Map<PanelId, PanelCoordinate>([
  ['panel-1', { id: 'panel-1', x: 0, y: 0, w: 2, h: 2 }],
]);

// Check if candidate position collides (excluding panel-2 from check)
if (hasCollision(candidate, 'panel-2', panelMap)) {
  console.log('Collision detected!');
}
```

### `rectanglesOverlap`

Low-level function that tests if two rectangles overlap using AABB (Axis-Aligned Bounding Box) testing.

```typescript
interface Rectangle {
  x: number;
  y: number;
  w: number;
  h: number;
}

function rectanglesOverlap(
  rect1: Rectangle,
  rect2: Rectangle
): boolean;
```

**Parameters:**
- `rect1` - First rectangle
- `rect2` - Second rectangle

**Returns:** `true` if rectangles overlap, `false` otherwise

**Example:**

```tsx
import { rectanglesOverlap } from 'panelgrid/helpers';

const rect1 = { x: 0, y: 0, w: 2, h: 2 };
const rect2 = { x: 1, y: 1, w: 2, h: 2 };

const overlaps = rectanglesOverlap(rect1, rect2); // true
```

## Rearrangement

Functions for rearranging panels and finding valid positions.

### `rearrangePanels`

The default rearrangement algorithm used by PanelGrid. Resolves collisions by pushing colliding panels horizontally (right) first, then vertically (down). Uses a BFS-style queue to handle cascading collisions.

```typescript
function rearrangePanels(
  movingPanel: PanelCoordinate,
  allPanels: PanelCoordinate[],
  columnCount: number
): PanelCoordinate[];
```

**Parameters:**
- `movingPanel` - The panel that was moved
- `allPanels` - All panels in the grid (including the moving panel)
- `columnCount` - Number of columns in the grid

**Returns:** New array of panels with collisions resolved

**Example:**

```tsx
import { rearrangePanels } from 'panelgrid/helpers';
import type { RearrangementFunction } from 'panelgrid';

// Wrap the default function to add custom behavior
const customRearrange: RearrangementFunction = (
  movingPanel,
  allPanels,
  columnCount
) => {
  // Use default rearrangement
  const result = rearrangePanels(movingPanel, allPanels, columnCount);

  // Apply custom post-processing
  return result.map(panel => ({
    ...panel,
    // Your custom modifications
  }));
};
```

### `findNewPosition`

Calculates a new position for a panel that is being pushed away by another panel. Used internally by the rearrangement algorithm.

```typescript
function findNewPosition(
  panel: PanelCoordinate,
  pusher: PanelCoordinate,
  columnCount: number
): { x: number; y: number };
```

**Parameters:**
- `panel` - The panel being pushed (the one that needs a new position)
- `pusher` - The panel doing the pushing (typically the moving panel)
- `columnCount` - Number of columns in the grid

**Returns:** Object with `x` and `y` coordinates for the pushed panel's new position

**Example:**

```tsx
import { findNewPosition } from 'panelgrid/helpers';

const pusher: PanelCoordinate = { id: 'panel-1', x: 0, y: 0, w: 2, h: 2 };
const pushed: PanelCoordinate = { id: 'panel-2', x: 1, y: 0, w: 2, h: 2 };

const { x, y } = findNewPosition(pushed, pusher, 6);
// Returns: { x: 2, y: 0 } - panel-2 is pushed to the right
```

## Grid Calculations

Utility functions for converting between pixel coordinates and grid positions.

### `snapToGrid`

Snaps a pixel value to the nearest grid position.

```typescript
function snapToGrid(value: number, baseSize: number): number;
```

**Parameters:**
- `value` - Pixel value to snap
- `baseSize` - Size of one grid cell in pixels

**Returns:** Snapped pixel value

**Example:**

```tsx
import { snapToGrid } from 'panelgrid/helpers';

const baseSize = 100; // Each grid cell is 100px
const mouseX = 247; // Mouse position

const snappedX = snapToGrid(mouseX, baseSize); // 200
```

### `gridToPixels`

Converts grid units to pixels, accounting for gaps.

```typescript
function gridToPixels(
  gridUnits: number,
  baseSize: number,
  gap: number
): number;
```

**Parameters:**
- `gridUnits` - Number of grid units
- `baseSize` - Size of one grid cell in pixels
- `gap` - Gap between cells in pixels

**Returns:** Pixel value

**Example:**

```tsx
import { gridToPixels } from 'panelgrid/helpers';

const pixels = gridToPixels(3, 100, 8);
// 3 cells × 100px + 2 gaps × 8px = 316px
```

### `pixelsToGridPosition`

Converts a pixel coordinate to a grid position.

```typescript
function pixelsToGridPosition(
  pixels: number,
  baseSize: number,
  gap: number
): number;
```

**Parameters:**
- `pixels` - Pixel coordinate
- `baseSize` - Size of one grid cell in pixels
- `gap` - Gap between cells in pixels

**Returns:** Grid position (column or row index)

**Example:**

```tsx
import { pixelsToGridPosition } from 'panelgrid/helpers';

const gridX = pixelsToGridPosition(216, 100, 8); // 2
```

### `gridPositionToPixels`

Converts a grid position to pixel coordinates.

```typescript
function gridPositionToPixels(
  gridPosition: number,
  baseSize: number,
  gap: number
): number;
```

**Parameters:**
- `gridPosition` - Grid position (column or row index)
- `baseSize` - Size of one grid cell in pixels
- `gap` - Gap between cells in pixels

**Returns:** Pixel coordinate

**Example:**

```tsx
import { gridPositionToPixels } from 'panelgrid/helpers';

const pixelX = gridPositionToPixels(2, 100, 8); // 216
```

### `pixelsToGridSize`

Converts a pixel size to grid units.

```typescript
function pixelsToGridSize(
  pixels: number,
  baseSize: number,
  gap: number
): number;
```

**Parameters:**
- `pixels` - Pixel size (width or height)
- `baseSize` - Size of one grid cell in pixels
- `gap` - Gap between cells in pixels

**Returns:** Size in grid units

**Example:**

```tsx
import { pixelsToGridSize } from 'panelgrid/helpers';

const gridWidth = pixelsToGridSize(216, 100, 8); // 2
```

## Panel Detection

Functions for detecting changes in panel positions.

### `detectAnimatingPanels`

Detects which panels changed position between two states. Useful for applying animations only to panels that moved.

```typescript
function detectAnimatingPanels(
  oldPanels: PanelCoordinate[],
  newPanels: PanelCoordinate[]
): Set<PanelId>;
```

**Parameters:**
- `oldPanels` - Panel state before the change
- `newPanels` - Panel state after the change

**Returns:** Set of panel IDs that changed position

**Example:**

```tsx
import { detectAnimatingPanels } from 'panelgrid/helpers';

const oldState = [
  { id: 1, x: 0, y: 0, w: 2, h: 2 },
  { id: 2, x: 2, y: 0, w: 1, h: 1 },
];

const newState = [
  { id: 1, x: 0, y: 0, w: 2, h: 2 }, // No change
  { id: 2, x: 3, y: 0, w: 1, h: 1 }, // Moved
];

const animating = detectAnimatingPanels(oldState, newState);
// Returns: Set { 2 }
```

## Animation

Low-level animation utilities.

### `applySnapAnimation`

Applies a smooth snap animation to a DOM element using requestAnimationFrame.

```typescript
function applySnapAnimation(
  element: HTMLElement,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  duration: number
): () => void;
```

**Parameters:**
- `element` - The DOM element to animate
- `fromX` - Starting X position in pixels
- `fromY` - Starting Y position in pixels
- `toX` - Target X position in pixels
- `toY` - Target Y position in pixels
- `duration` - Animation duration in milliseconds

**Returns:** Cleanup function to cancel the animation

**Example:**

```tsx
import { applySnapAnimation } from 'panelgrid/helpers';

const panelElement = document.getElementById('panel-1');

if (panelElement) {
  const cleanup = applySnapAnimation(
    panelElement,
    0, 0,    // From (0, 0)
    200, 100, // To (200, 100)
    300      // 300ms duration
  );

  // Cancel animation if needed
  // cleanup();
}
```

## Advanced Examples

### Gravity-Based Rearrangement

Panels fall downward to fill empty space:

```tsx
import { hasCollision } from 'panelgrid/helpers';
import type { RearrangementFunction, PanelCoordinate, PanelId } from 'panelgrid';

const gravityRearrangement: RearrangementFunction = (
  movingPanel,
  allPanels,
  columnCount
) => {
  const result = [...allPanels];
  const movingIndex = result.findIndex(p => p.id === movingPanel.id);
  result[movingIndex] = movingPanel;

  // Sort panels by Y position (top to bottom)
  const sorted = result.sort((a, b) => a.y - b.y);

  // Apply gravity: move each panel down as far as possible
  for (const panel of sorted) {
    let newY = panel.y;

    // Create panel map for collision detection
    const panelMap = new Map<PanelId, PanelCoordinate>(
      result.map(p => [p.id, p])
    );

    // Try moving down until we hit a collision or can't move further
    while (newY > 0) {
      const testPanel = { ...panel, y: newY - 1 };

      if (hasCollision(testPanel, panel.id, panelMap)) {
        break;
      }
      newY--;
    }

    const panelIndex = result.findIndex(p => p.id === panel.id);
    result[panelIndex] = { ...panel, y: newY };
  }

  return result;
};
```

### Magnetic Alignment

Panels snap to nearby panel edges when dragged close:

```tsx
import { detectCollisions } from 'panelgrid/helpers';
import type { RearrangementFunction, PanelCoordinate, PanelId } from 'panelgrid';

const magneticRearrangement: RearrangementFunction = (
  movingPanel,
  allPanels,
  columnCount
) => {
  const MAGNETIC_THRESHOLD = 0.3; // 30% of a cell

  // Find nearby panels
  const nearby = allPanels.filter(p => {
    if (p.id === movingPanel.id) return false;
    const dx = Math.abs(p.x - movingPanel.x);
    const dy = Math.abs(p.y - movingPanel.y);
    return dx <= 2 && dy <= 2;
  });

  let snappedPanel = { ...movingPanel };

  // Snap to nearby panel edges
  for (const panel of nearby) {
    // Snap to right edge
    if (Math.abs(movingPanel.x - (panel.x + panel.w)) < MAGNETIC_THRESHOLD) {
      snappedPanel.x = panel.x + panel.w;
    }
    // Snap to bottom edge
    if (Math.abs(movingPanel.y - (panel.y + panel.h)) < MAGNETIC_THRESHOLD) {
      snappedPanel.y = panel.y + panel.h;
    }
  }

  // Create panel map for collision detection
  const panelMap = new Map<PanelId, PanelCoordinate>(
    allPanels.filter(p => p.id !== movingPanel.id).map(p => [p.id, p])
  );

  // Check for collisions
  const collidingIds = detectCollisions(snappedPanel, panelMap);

  if (collidingIds.length > 0) {
    // Fall back to non-snapped position
    return allPanels.map(p => p.id === movingPanel.id ? movingPanel : p);
  }

  return allPanels.map(p => p.id === movingPanel.id ? snappedPanel : p);
};
```

### Collision Prevention (No Auto-Rearrange)

Prevents moves that would cause collisions:

```tsx
import { hasCollision } from 'panelgrid/helpers';
import type { RearrangementFunction, PanelCoordinate, PanelId } from 'panelgrid';

const preventCollisionRearrangement: RearrangementFunction = (
  movingPanel,
  allPanels,
  columnCount
) => {
  // Create panel map for collision detection
  const panelMap = new Map<PanelId, PanelCoordinate>(
    allPanels.map(p => [p.id, p])
  );

  // If the move causes a collision, revert to original position
  if (hasCollision(movingPanel, movingPanel.id, panelMap)) {
    const originalPanel = allPanels.find(p => p.id === movingPanel.id);
    return allPanels.map(p =>
      p.id === movingPanel.id ? originalPanel! : p
    );
  }

  // No collision, allow the move
  return allPanels.map(p =>
    p.id === movingPanel.id ? movingPanel : p
  );
};
```

### Zone-Based Layout

Restricts panels to specific zones with custom collision handling:

```tsx
import { rearrangePanels, detectCollisions } from 'panelgrid/helpers';
import type { RearrangementFunction } from 'panelgrid';

interface Zone {
  xMin: number;
  xMax: number;
  yMin?: number;
  yMax?: number;
  allowedPanels?: Set<number | string>;
}

const zoneRearrangement: RearrangementFunction = (
  movingPanel,
  allPanels,
  columnCount
) => {
  // Define zones
  const zones: Record<string, Zone> = {
    header: { xMin: 0, xMax: columnCount - 1, yMin: 0, yMax: 2 },
    sidebar: { xMin: 0, xMax: 1, yMin: 3, yMax: 10 },
    main: { xMin: 2, xMax: columnCount - 1, yMin: 3, yMax: 10 },
  };

  // Determine which zone the panel belongs to
  const getZone = (panel: PanelCoordinate): Zone | null => {
    for (const zone of Object.values(zones)) {
      const inX = panel.x >= zone.xMin && panel.x + panel.w <= zone.xMax + 1;
      const inY = zone.yMin === undefined ||
        (panel.y >= zone.yMin && panel.y + panel.h <= (zone.yMax || Infinity) + 1);

      if (inX && inY) return zone;
    }
    return null;
  };

  // Use default rearrangement
  const result = rearrangePanels(movingPanel, allPanels, columnCount);

  // Constrain panels to their zones
  return result.map(panel => {
    const zone = getZone(panel);
    if (!zone) return panel;

    return {
      ...panel,
      x: Math.max(zone.xMin, Math.min(panel.x, zone.xMax - panel.w + 1)),
      y: zone.yMin !== undefined
        ? Math.max(zone.yMin, Math.min(panel.y, (zone.yMax || Infinity) - panel.h + 1))
        : panel.y,
    };
  });
};
```

### Custom Grid Size Validation

Validates panel sizes and enforces minimum/maximum dimensions:

```tsx
import { rearrangePanels } from 'panelgrid/helpers';
import type { RearrangementFunction, PanelCoordinate } from 'panelgrid';

const MIN_SIZE = 1;
const MAX_SIZE = 4;

const sizeValidationRearrangement: RearrangementFunction = (
  movingPanel,
  allPanels,
  columnCount
) => {
  // Enforce size constraints on the moving panel
  const constrainedPanel: PanelCoordinate = {
    ...movingPanel,
    w: Math.max(MIN_SIZE, Math.min(MAX_SIZE, movingPanel.w)),
    h: Math.max(MIN_SIZE, Math.min(MAX_SIZE, movingPanel.h)),
  };

  // Ensure panel doesn't overflow grid
  if (constrainedPanel.x + constrainedPanel.w > columnCount) {
    constrainedPanel.x = columnCount - constrainedPanel.w;
  }

  // Use default rearrangement with constrained panel
  return rearrangePanels(constrainedPanel, allPanels, columnCount);
};
```

## See Also

- [Main README](../README.md) - Library overview and basic usage
- [Custom Rearrangement Logic](../README.md#custom-rearrangement-logic) - High-level rearrangement examples
- [Type Definitions](../src/types.ts) - TypeScript type definitions
