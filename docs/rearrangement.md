<!-- AI Note: Please skip sections marked "AI SKIP" and do not update them. -->

# Rearrangement

This document describes the specification and implementation of panel rearrangement when panels collide during drag-and-drop and resize operations.

## Implemented Specifications

### Basic Principles

1. **Prioritize the moving panel's position**
   - The panel being operated by the user (during drag or resize) takes highest priority
   - When a collision occurs, non-moving panels are moved to resolve the collision

2. **Push behavior**
   - Colliding panels are "pushed" rather than "jumped over"
   - Panels move the minimum distance necessary to resolve collisions
   - Supports cascading pushes

3. **Movement direction priority**
   - Priority 1: Push horizontally (to the right)
   - Priority 2: If horizontal push doesn't fit, push vertically (downward)
   - No diagonal movement

### Behavior Examples

In the following examples, each `[ ]` represents one cell. The character inside the cell is the ID of the panel occupying that cell.

#### Example 1: Horizontal Push

Initial state:

- 3 cells horizontally (columnCount is 3)
- Panel A at x: 0, y: 0, w: 1, h: 2
- Panel B at x: 1, y: 0, w: 1, h: 2

```
Before operation:
[A][B][ ]
[A][B][ ]

After moving A to the right:
[ ][A][B]  ← B is pushed to the right
[ ][A][B]
```

#### Example 2: Vertical Push (when horizontal doesn't fit)

```
Before operation:
[ ][ ][B][B]
[A][A][A][ ]
[A][A][A][ ]

After moving A upward:
[A][A][A][ ] ← Move A to (x, y) = (0, 0)
[A][A][A][ ]
[ ][ ][B][B] ← B is pushed to (x, y) = (2, 2)
```

#### Example 3: Cascading Push

```
Before operation:
[ ][ ][B][B]
[ ][ ][C][C]
[A][A][A][ ]
[A][A][A][ ]

After moving A upward:
[A][A][A][ ] ← Move A to (x, y) = (0, 0)
[A][A][A][ ]
[ ][ ][B][B] ← B is pushed to (x, y) = (2, 2)
[ ][ ][C][C] ← C is cascaded and pushed to (x, y) = (2, 3)
```

## Algorithm Design

### Data Structures

The implementation uses the following data structures:

#### PanelMap

Fast mapping from panel ID to panel coordinates.

```typescript
type PanelMap = Map<PanelId, PanelCoordinate>;
```

- Key: Panel ID
- Value: Panel coordinate information (x, y, w, h)
- O(1) panel lookup and updates

### Core Algorithms

#### 1. Rectangle Overlap Detection (`rectanglesOverlap`)

Uses AABB (Axis-Aligned Bounding Box) testing to determine if two panels overlap.

```typescript
function rectanglesOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean;
// Conditions where two rectangles do NOT overlap (any of the following):
// - a is to the left of b: a.x + a.w <= b.x
// - b is to the left of a: b.x + b.w <= a.x
// - a is above b: a.y + a.h <= b.y
// - b is above a: b.y + b.h <= a.y
// If all conditions are false, they overlap
return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
```

#### 2. Collision Detection (`detectCollisions`)

Returns all panel IDs that collide with the specified panel.

```typescript
function detectCollisions(
  panel: PanelCoordinate,
  panelMap: Map<PanelId, PanelCoordinate>
): PanelId[]
  1. Create a Set to store colliding panel IDs
  2. Loop through all panels in panelMap:
     for each [id, other] of panelMap:
       if id == panel.id:
         continue  // Skip self

       if rectanglesOverlap(panel, other):
         Add id to Set

  3. Convert Set to array and return
```

#### 3. Calculate Push Distance (`calculatePushDistance`)

Calculates the minimum distance and direction to push a colliding panel.

```typescript
function calculatePushDistance(
  pusher: PanelCoordinate,
  pushed: PanelCoordinate,
  columnCount: number
): { direction: "right" | "down"; distance: number } | null
  1. Calculate horizontal push distance:
     pushRight = pusher.x + pusher.w - pushed.x
     canPushRight = pushed.x + pushed.w + pushRight <= columnCount

  2. Calculate vertical push distance:
     pushDown = pusher.y + pusher.h - pushed.y

  3. Priority 1: Choose horizontal if possible
     if canPushRight and pushRight > 0:
       return { direction: "right", distance: pushRight }

  4. Priority 2: Push vertically
     if pushDown > 0:
       return { direction: "down", distance: pushDown }

  5. If no push needed:
     return null
```

#### 4. Find New Position (`findNewPosition`)

Calculates the new position for a panel being pushed.

```typescript
function findNewPosition(
  panel: PanelCoordinate,
  pusher: PanelCoordinate,
  columnCount: number
): { x: number; y: number }
  1. pushInfo = calculatePushDistance(pusher, panel, columnCount)

  2. If pushInfo is null (fallback when no push needed):
     return { x: panel.x, y: panel.y + 1 }

  3. If pushing horizontally:
     if pushInfo.direction == "right":
       newX = panel.x + pushInfo.distance
       if newX + panel.w <= columnCount:
         return { x: newX, y: panel.y }
       // If doesn't fit horizontally, proceed to next step

  4. Push vertically:
     return { x: panel.x, y: panel.y + pushInfo.distance }
```

#### 5. Rearrange Panels (`rearrangePanels`)

Rearranges panels to resolve collisions during panel movement or resize.

```typescript
function rearrangePanels(
  movingPanel: PanelCoordinate,
  allPanels: PanelCoordinate[],
  columnCount: number
): PanelCoordinate[]
  1. Create fast map from panel ID to coordinates:
     panelMap = new Map<PanelId, PanelCoordinate>()
     for each panel in allPanels:
       panelMap.set(panel.id, {...panel})

  2. Reflect moving panel's position in map:
     panelMap.set(movingPanel.id, {...movingPanel})

  3. Processing queue: queue = [movingPanel]
     Processed panel IDs: processed = new Set()

  4. Process panels until no collisions remain:
     while queue.length > 0:
       current = queue.shift()

       if processed.has(current.id):
         continue
       processed.add(current.id)

       // Detect collisions at current panel position
       collidingIds = detectCollisions(current, panelMap)

       if collidingIds is empty:
         // No collision, maintain current position
         panelMap.set(current.id, current)
         continue

       // Resolve collisions: push colliding panels
       for each collidingId in collidingIds:
         colliding = panelMap.get(collidingId)
         if !colliding: continue

         // Move colliding panel in push direction
         newPos = findNewPosition(colliding, current, columnCount)

         // Update panel position
         updated = {...colliding, x: newPos.x, y: newPos.y}
         panelMap.set(collidingId, updated)

         // Add to queue for re-checking collisions
         queue.push(updated)

       // Confirm current panel's position
       panelMap.set(current.id, current)

  5. Return rearranged panels:
     return Array.from(panelMap.values())
```

### Algorithm Characteristics

1. **Incremental collision resolution**: Uses a queue to sequentially resolve cascading collisions caused by movement
2. **Push behavior**: `calculatePushDistance` moves panels the minimum distance necessary
3. **Horizontal-first movement**: Prioritizes horizontal movement when it fits, switches to vertical otherwise

### Complexity

- **Rectangle overlap detection**: O(1)
- **Collision detection**: O(N) (check against all panels)
- **Push distance calculation**: O(1)
- **Panel rearrangement**: O(N²) (worst case: all panels move in cascade)
- **Overall**: O(N²) (optimal for small number of panels)
