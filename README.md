# PanelGrid

A flexible and performant React grid layout library with drag-and-drop and resize capabilities.

## Features

- 🎯 **Drag and Drop**: Intuitive panel repositioning with snap-to-grid behavior
- 📏 **Resizable**: Panels can be resized with visual feedback
- 🎨 **Ghost Panel**: Visual preview of panel placement during drag/resize operations
- ⚡ **Performance Optimized**: Direct DOM manipulation for high-frequency interactions
- 🔧 **TypeScript**: Full type safety with comprehensive type definitions
- 📦 **Tree-shakeable**: ESM and CommonJS builds available
- 🎛️ **Customizable Rearrangement**: Override default collision resolution logic
- ⚛️ **React Server Components**: Full support for Next.js App Router and RSC

## Documentation & Demo

Interactive documentation and live examples are available on our [**Storybook site**](https://chloe463.github.io/panelgrid/).

Explore comprehensive examples including:
- Basic grid layouts
- Size-locked panels
- Custom rearrangement algorithms
- Performance demonstrations with heavy calculations

### Running Storybook Locally

```bash
# Start Storybook development server
yarn storybook

# Build Storybook for production
yarn build:storybook
```

## Requirements

- React 18.0.0 or higher
- React DOM 18.0.0 or higher

## Installation

```bash
npm install panelgrid
# or
yarn add panelgrid
# or
pnpm add panelgrid
```

## Usage

```tsx
import { PanelGridProvider, PanelGridRenderer } from 'panelgrid';
import type { PanelCoordinate } from 'panelgrid';
import 'panelgrid/styles.css';

const initialPanels: PanelCoordinate[] = [
  { id: 1, x: 0, y: 0, w: 2, h: 2 },
  { id: 2, x: 2, y: 0, w: 1, h: 1 },
  { id: 3, x: 0, y: 2, w: 1, h: 1 },
];

// Mark panel component with "use client" for Next.js App Router
"use client";
function PanelContent({ id }: { id: number | string }) {
  return <div>Panel {id}</div>;
}

function App() {
  return (
    <PanelGridProvider
      panels={initialPanels}
      columnCount={4}
      gap={8}
    >
      <PanelGridRenderer>{PanelContent}</PanelGridRenderer>
    </PanelGridProvider>
  );
}
```

**Note:** Don't forget to import the CSS file to enable proper styling for the panels.

### Next.js App Router / React Server Components

PanelGrid is fully compatible with Next.js App Router and React Server Components. The library exports are marked with `"use client"` where necessary.

**Important:** Your panel content components must also be marked with `"use client"` if they:
- Use React hooks (`useState`, `useEffect`, etc.)
- Access browser APIs
- Use event handlers

```tsx
// app/dashboard/page.tsx (Server Component)
import { PanelGridProvider, PanelGridRenderer } from 'panelgrid';
import { PanelContent } from './PanelContent'; // Client Component
import 'panelgrid/styles.css';

export default function DashboardPage() {
  const panels = [
    { id: 1, x: 0, y: 0, w: 2, h: 2 },
    { id: 2, x: 2, y: 0, w: 2, h: 2 },
  ];

  return (
    <PanelGridProvider panels={panels} columnCount={4} gap={8}>
      <PanelGridRenderer>{PanelContent}</PanelGridRenderer>
    </PanelGridProvider>
  );
}
```

```tsx
// app/dashboard/PanelContent.tsx (Client Component)
"use client";
import { usePanelGridControls } from 'panelgrid';
import type { PanelId } from 'panelgrid';

export function PanelContent({ id }: { id: PanelId }) {
  const { removePanel } = usePanelGridControls();

  return (
    <div>
      <h3>Panel {id}</h3>
      <button onClick={() => removePanel(id)}>Remove</button>
    </div>
  );
}
```

## Advanced Usage

### Custom Rearrangement Logic

You can override the default collision resolution logic by providing a custom `rearrangement` function.

For advanced use cases, PanelGrid exports [helper functions](./docs/helpers.md) for collision detection, grid calculations, and more. See the [Helper Functions API Reference](./docs/helpers.md) for detailed documentation and examples.

```tsx
import { PanelGridProvider, rearrangePanels } from 'panelgrid';
import type { RearrangementFunction, PanelCoordinate } from 'panelgrid';

// Example: Custom rearrangement that prevents vertical movement
const customRearrange: RearrangementFunction = (
  movingPanel,
  allPanels,
  columnCount
) => {
  // Implement your custom collision resolution logic
  // For example: only allow horizontal panel movement

  // You can also wrap the default function
  const result = rearrangePanels(movingPanel, allPanels, columnCount);

  // Apply custom modifications
  return result.map(panel => ({
    ...panel,
    // Your custom logic here
  }));
};

function App() {
  return (
    <PanelGridProvider
      panels={initialPanels}
      columnCount={4}
      gap={8}
      rearrangement={customRearrange}
    >
      <PanelGridRenderer>{PanelContent}</PanelGridRenderer>
    </PanelGridProvider>
  );
}
```

#### Example: Disable Automatic Rearrangement

```tsx
const noRearrangement: RearrangementFunction = (movingPanel, allPanels) => {
  // Simply update the moving panel without affecting others
  return allPanels.map(panel =>
    panel.id === movingPanel.id ? movingPanel : panel
  );
};
```

#### Example: Fixed Zones

```tsx
const zoneRearrangement: RearrangementFunction = (
  movingPanel,
  allPanels,
  columnCount
) => {
  // Define zones where panels can be placed
  const zones = {
    left: { xMin: 0, xMax: 2 },
    right: { xMin: 3, xMax: 5 }
  };

  // Use default rearrangement
  const result = rearrangePanels(movingPanel, allPanels, columnCount);

  // Constrain panels to their zones
  return result.map(panel => {
    const inLeftZone = panel.x < 3;
    const zone = inLeftZone ? zones.left : zones.right;

    return {
      ...panel,
      x: Math.max(zone.xMin, Math.min(panel.x, zone.xMax))
    };
  });
};
```

### Customizing Styles

PanelGrid uses non-scoped CSS classes with the `panelgrid-` prefix, allowing you to override the default styles to match your application's design.

#### Available CSS Classes

- `.panelgrid-renderer` - The main grid container
- `.panelgrid-panel-placeholder` - Grid cell placeholders (background visualization)
- `.panelgrid-panel` - Individual panel container
- `.panelgrid-panel-ghost` - Ghost panel shown during drag/resize operations
- `.panelgrid-panel--dragging` - Applied to a panel while it's being dragged
- `.panelgrid-panel--with-transition` - Applied to panels that are animating to new positions
- `.panelgrid-resize-handle` - Resize handle in the bottom-right corner of panels

#### Example: Custom Panel Styling

```css
/* Import the base styles first */
@import 'panelgrid/styles.css';

/* Override panel appearance */
.panelgrid-panel {
  border-radius: 8px;
  border: 2px solid #3b82f6;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background-color: white;
}

/* Style the ghost panel */
.panelgrid-panel-ghost {
  outline: 2px dashed #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
}

/* Customize the resize handle */
.panelgrid-resize-handle {
  background-color: #3b82f6;
  width: 20px;
  border-bottom-right-radius: 8px;
}

.panelgrid-resize-handle:hover {
  background-color: #2563eb;
}

/* Style dragging state */
.panelgrid-panel--dragging {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  opacity: 0.8;
}

/* Customize grid placeholders */
.panelgrid-panel-placeholder {
  background-color: #f3f4f6;
  border-radius: 4px;
}
```

#### Example: Dark Mode Support

```css
@import 'panelgrid/styles.css';

@media (prefers-color-scheme: dark) {
  .panelgrid-panel-placeholder {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .panelgrid-panel {
    background-color: #1f2937;
    border-color: #374151;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .panelgrid-panel-ghost {
    outline-color: #60a5fa;
  }

  .panelgrid-resize-handle {
    background-color: rgba(255, 255, 255, 0.2);
  }
}
```

#### CSS Custom Properties

The renderer uses CSS custom properties that you can use in your custom styles:

- `--column-count` - Number of grid columns (set automatically)
- `--gap` - Gap between panels in pixels

```css
/* Example: Use custom properties in your styles */
.panelgrid-panel {
  /* Add padding based on the gap size */
  padding: calc(var(--gap) / 2);
}
```

## API

### `<PanelGridProvider>`

The main provider component that manages panel state.

**Props:**

- `panels`: `PanelCoordinate[]` - Array of panel configurations
- `columnCount`: `number` - Number of columns in the grid
- `gap`: `number` - Gap between panels in pixels
- `rearrangement?`: `RearrangementFunction` - Optional custom rearrangement logic (see [Custom Rearrangement Logic](#custom-rearrangement-logic))

### `<PanelGridRenderer>`

Renderer component that displays the panels.

**Props:**

- `children`: `React.ComponentType<{ id: PanelId }>` - Component type (not instance) to render each panel

**Example:**

```tsx
"use client";
function MyPanel({ id }: { id: PanelId }) {
  return <div>Panel {id}</div>;
}

// Pass the component type (not JSX)
<PanelGridRenderer>{MyPanel}</PanelGridRenderer>
```

For panels with custom props, create a wrapper component:

```tsx
"use client";
function CustomPanel({ id }: { id: PanelId }) {
  return <MyPanel id={id} customProp="value" />;
}

<PanelGridRenderer>{CustomPanel}</PanelGridRenderer>
```

### `usePanelGridControls()`

Hook to access panel control functions.

**Returns:**

- `addPanel(panel: Partial<PanelCoordinate>)`: Add a new panel
- `removePanel(id: PanelId)`: Remove a panel by ID
- `exportState()`: Export current panel state

### Types

```typescript
type PanelId = number | string;

interface PanelCoordinate {
  id: PanelId;
  x: number;      // Column position (0-indexed)
  y: number;      // Row position (0-indexed)
  w: number;      // Width in columns
  h: number;      // Height in rows
  lockSize?: boolean; // If true, prevents panel from being resized
}

type RearrangementFunction = (
  movingPanel: PanelCoordinate,
  allPanels: PanelCoordinate[],
  columnCount: number
) => PanelCoordinate[];
```

### Exported Functions

**Main Export:**
- `rearrangePanels(movingPanel, allPanels, columnCount)`: Default rearrangement function that can be imported and extended

**Helper Functions:**

PanelGrid exports a comprehensive set of helper functions for building custom rearrangement logic, including collision detection, grid calculations, panel detection, and animation utilities.

See the [Helper Functions API Reference](./docs/helpers.md) for complete documentation.

Quick example:
```tsx
import {
  detectCollisions,
  hasCollision,
  snapToGrid,
  findNewPosition
} from 'panelgrid/helpers';
```

## Development

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build package
yarn build

# Run tests
yarn test

# Type check
yarn typecheck

# Lint
yarn lint

# Format
yarn format
```

## License

MIT