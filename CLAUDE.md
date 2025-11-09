# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Panelist is a React grid layout library with drag-and-drop and resize capabilities. It's built as a publishable npm package with both ESM and CJS outputs, TypeScript support, and comprehensive test coverage.

## Development Commands

### Building
- `yarn build` - Build package (uses tsdown + copies CSS)
- `yarn build:demo` - Build demo application for preview

### Testing
- `yarn test` - Run all tests with Vitest
- `yarn test -- <filename>` - Run specific test file (e.g., `yarn test -- rearrangement.test.ts`)

### Code Quality
- `yarn typecheck` - Run TypeScript type checking (no emit)
- `yarn lint` - Check code with Biome
- `yarn lint:fix` - Auto-fix linting issues with Biome
- `yarn format` - Format code with Biome

### Development Server
- `yarn dev` - Start Vite development server for testing the demo

## Architecture

### Core Components

1. **PanelistProvider** (src/PanelistProvider.tsx)
   - Context provider that manages panel state
   - Splits state and controls into separate contexts (`PanelistStateContext` and `PanelistControlsContext`)
   - Accepts optional `rearrangement` prop to override collision resolution logic
   - Wraps the `usePanelist` hook

2. **PanelistRenderer** (src/PanelistRenderer.tsx)
   - Renders the grid layout, panels, and ghost panel
   - Uses ResizeObserver to calculate `baseSize` (grid cell width) dynamically
   - Renders placeholder divs for grid visualization
   - Handles panel rendering via `itemRenderer` prop

3. **usePanelist** (src/usePanelist.ts)
   - Core hook containing all drag/drop/resize logic
   - Uses **direct DOM manipulation** (not React state) during drag/resize for performance
   - Maintains `internalState` ref for high-frequency state that doesn't need React re-renders
   - Returns panel props with event handlers and styling
   - Handles ghost panel visibility and animations

### Key Architectural Patterns

#### Direct DOM Manipulation for Performance
The library intentionally uses direct DOM manipulation during drag and resize operations to avoid React re-renders during high-frequency mousemove events. See usePanelist.ts:64-92 for ghost panel helpers.

#### Collision Resolution System
- **Default algorithm** (src/helpers/rearrangement.ts:152): Pushes colliding panels horizontally first (right), then vertically (down)
- Uses BFS-style queue processing to handle cascading collisions
- **Custom rearrangement**: Users can override by passing `rearrangement` prop to PanelistProvider
- The `RearrangementFunction` type signature: `(movingPanel, allPanels, columnCount) => PanelCoordinate[]`

#### Animation System
- Panels being pushed by collisions get `isAnimating` flag and CSS transitions (src/usePanelist.ts:351-355)
- Snap-back animations use requestAnimationFrame (src/helpers/animation.ts)
- Animation timeouts tracked in ref and cleaned up on unmount (src/usePanelist.ts:56-62)

### Helper Modules (src/helpers/)

- **rearrangement.ts**: Collision detection and resolution logic (AABB testing, BFS queue processing)
- **gridCalculations.ts**: Pixel ↔ grid coordinate conversions
- **animation.ts**: Snap animation helpers using requestAnimationFrame
- **panelDetection.ts**: Detects which panels changed position (for animations)
- **throttle.ts**: Throttling utility for performance

### Testing

Tests are colocated with implementation files (e.g., `rearrangement.test.ts` next to `rearrangement.ts`). Vitest is configured with jsdom environment for DOM testing.

### Build System

- **tsdown** for package bundling (ESM + CJS + type definitions)
- **Vite** for development server and demo build
- CSS file manually copied to dist (src/styles.css → dist/styles.css)
- Package exports both code (`./`) and styles (`./styles.css`)

## Important Constraints

1. **Grid boundaries**: Panels are constrained to columnCount via `constrainToGrid` (rearrangement.ts:129-144)
2. **Panel overflow prevention**: Fixed in PR #24 - panels cannot overflow beyond grid boundaries
3. **Performance**: High-frequency events (mousemove during drag/resize) bypass React state updates
4. **Dependencies**: Peer dependencies on React/ReactDOM 18+ (also supports React 19)

## Code Style

- Biome is used for linting and formatting (migrated from ESLint/Prettier in PR #20)
- Husky + lint-staged runs Biome on pre-commit
- TypeScript strict mode enabled

## Common Patterns

### Adding Panel Controls
Use `usePanelistControls()` hook to get `addPanel`, `removePanel`, `exportState` functions.

### Custom Rearrangement
Export and wrap the default `rearrangePanels` function, or implement completely custom logic. See README.md "Custom Rearrangement Logic" section for examples.

### Direct DOM Access During Interactions
When modifying interaction behavior (drag/resize), look for `internalState` ref patterns and direct style manipulation rather than React state.
