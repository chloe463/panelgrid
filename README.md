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

## API

### `<PanelistProvider>`

The main provider component that manages panel state.

**Props:**

- `panels`: `PanelCoordinate[]` - Array of panel configurations
- `columnCount`: `number` - Number of columns in the grid
- `gap`: `number` - Gap between panels in pixels

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