# Panelist

A flexible and performant React grid layout library with drag-and-drop and resize capabilities.

## Features

- 🎯 **Drag and Drop**: Intuitive panel repositioning with snap-to-grid behavior
- 📏 **Resizable**: Panels can be resized with visual feedback
- 🎨 **Ghost Panel**: Visual preview of panel placement during drag/resize operations
- ⚡ **Performance Optimized**: Direct DOM manipulation for high-frequency interactions
- 🔧 **TypeScript**: Full type safety with comprehensive type definitions
- ♿ **Accessible**: ARIA attributes and keyboard navigation support
- 📦 **Tree-shakeable**: ESM and CommonJS builds available
- 🎛️ **Customizable Rearrangement**: Override default collision resolution logic

## Requirements

- React 18.0.0 or higher
- React DOM 18.0.0 or higher

## Installation

```bash
npm install panelist
# or
yarn add panelist
# or
pnpm add panelist
```

## Usage

```tsx
import { PanelistProvider, PanelistRenderer } from 'panelist';
import type { PanelCoordinate } from 'panelist';
import 'panelist/styles.css';

const initialPanels: PanelCoordinate[] = [
  { id: 1, x: 0, y: 0, w: 2, h: 2 },
  { id: 2, x: 2, y: 0, w: 1, h: 1 },
  { id: 3, x: 0, y: 2, w: 1, h: 1 },
];

function PanelContent({ id }: { id: number | string }) {
  return <div>Panel {id}</div>;
}

function App() {
  return (
    <PanelistProvider
      panels={initialPanels}
      columnCount={4}
      gap={8}
    >
      <PanelistRenderer itemRenderer={PanelContent} />
    </PanelistProvider>
  );
}
```

**Note:** Don't forget to import the CSS file to enable proper styling for the panels.

## Advanced Usage

### Custom Rearrangement Logic

You can override the default collision resolution logic by providing a custom `rearrangement` function:

```tsx
import { PanelistProvider, rearrangePanels } from 'panelist';
import type { RearrangementFunction, PanelCoordinate } from 'panelist';

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
    <PanelistProvider
      panels={initialPanels}
      columnCount={4}
      gap={8}
      rearrangement={customRearrange}
    >
      <PanelistRenderer itemRenderer={PanelContent} />
    </PanelistProvider>
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

## API

### `<PanelistProvider>`

The main provider component that manages panel state.

**Props:**

- `panels`: `PanelCoordinate[]` - Array of panel configurations
- `columnCount`: `number` - Number of columns in the grid
- `gap`: `number` - Gap between panels in pixels
- `rearrangement?`: `RearrangementFunction` - Optional custom rearrangement logic (see [Custom Rearrangement Logic](#custom-rearrangement-logic))

### `<PanelistRenderer>`

Renderer component that displays the panels.

**Props:**

- `itemRenderer`: `React.ComponentType<{ id: PanelId }>` - Component to render each panel

### `usePanelistControls()`

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
}

type RearrangementFunction = (
  movingPanel: PanelCoordinate,
  allPanels: PanelCoordinate[],
  columnCount: number
) => PanelCoordinate[];
```

### Exported Functions

- `rearrangePanels(movingPanel, allPanels, columnCount)`: Default rearrangement function that can be imported and extended

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