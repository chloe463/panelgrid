# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.4.2](https://github.com/chloe463/panelgrid/compare/v0.4.1...v0.4.2) (2026-02-08)


### Fixed

* hide resize handles on size-locked panels ([#65](https://github.com/chloe463/panelgrid/issues/65)) ([5e8f729](https://github.com/chloe463/panelgrid/commit/5e8f729c9879a0cebc577daac5fea79f04588334))

## [0.4.1](https://github.com/chloe463/panelgrid/compare/v0.4.0...v0.4.1) (2026-02-07)


### Fixed

* resolve panel collision bug when multiple panels pushed to same position ([#64](https://github.com/chloe463/panelgrid/issues/64)) ([2f9e33c](https://github.com/chloe463/panelgrid/commit/2f9e33c1b07479506339a08e604c2aac3775e0de))

## [0.4.0] - 2025-12-14

### Added
- Public API for helper functions to enable advanced custom rearrangement logic (#63)
  - New `panelgrid/helpers` export with utility functions for building custom layouts
  - **Collision detection**: `detectCollisions`, `hasCollision`, `rectanglesOverlap`
  - **Rearrangement utilities**: `rearrangePanels`, `findNewPosition`
  - **Grid calculations**: `snapToGrid`, `gridToPixels`, `pixelsToGrid*`
  - **Panel detection**: `detectAnimatingPanels`
  - **Animation**: `applySnapAnimation`
- Comprehensive helper functions documentation in `docs/helpers.md` with 5 advanced examples (#63)
- English translation of rearrangement algorithm documentation (#63)
- Japanese version of rearrangement documentation (`docs/rearrangement-jp.md`) (#63)

## [0.3.0] - 2025-12-13

### Fixed
- Complex collision resolution in chain reaction scenarios (#60)
  - Fixed bug where collisions weren't fully resolved when multiple panels were pushed simultaneously
  - Added tracking of panels pushed within the same iteration to prevent conflicts
  - Implemented two-phase processing for compound panel resizes (both width and height changes)
  - Algorithm now allows panels to be reprocessed when moved by other panels
  - Properly calculates vertical positions to avoid all overlapping panels

## [0.2.0] - 2025-11-30

### Added
- Full React Server Components (RSC) compatibility for Next.js App Router (#58)
- `"use client"` directive to `PanelGridProvider`, `PanelGridRenderer`, and `usePanel` (#58)

### Changed
- **BREAKING**: `PanelGridRenderer` now accepts a component type as children instead of a render function (#58)
  - Before: `<PanelGridRenderer>{(id) => <PanelContent id={id} />}</PanelGridRenderer>`
  - After: `<PanelGridRenderer>{PanelContent}</PanelGridRenderer>`
- Updated all examples and documentation to use new component reference API (#58)

### Migration Guide
For users upgrading from 0.1.4 or earlier:

1. **Simple case** (no extra props):
   ```tsx
   // Before
   <PanelGridRenderer>{(id) => <MyPanel id={id} />}</PanelGridRenderer>

   // After
   <PanelGridRenderer>{MyPanel}</PanelGridRenderer>
   ```

2. **With custom props** - create a wrapper component marked with `"use client"`:
   ```tsx
   "use client";
   function CustomPanel({ id }: { id: PanelId }) {
     return <MyPanel id={id} extraProp="value" />;
   }

   <PanelGridRenderer>{CustomPanel}</PanelGridRenderer>
   ```

3. **Ensure your panel components have `"use client"`** if they use hooks or browser APIs

## [0.1.4] - 2025-11-30

### Added
- Support for configurable resize handle positions in all 8 directions: n, e, s, w, ne, nw, se, sw (#55)
- `resizeHandles` prop to customize which resize handles are displayed on panels (#55)
- SVG-based resize handle icons with smooth opacity transitions (#55)
- Visual feedback on panel hover - resize handles fade in on hover (#55)
- CustomResizeHandlers.stories.tsx with 10 example configurations (#55)

### Changed
- Updated ghost panel position calculation during resize from non-southeast corners (#55)
- Improved resize behavior for north and west side handles with proper delta inversion (#55)
- Dynamic cursor assignment based on active resize handle position (#55)
- Moved RESIZE_CURSOR_MAP to module-level constant for better performance (#55)

### Fixed
- Fixed resize behavior to constrain size changes for edge-only handles (#55)
- Prevented width changes when using vertical-only resize handles (n, s) (#55)
- Prevented height changes when using horizontal-only resize handles (e, w) (#55)
- Corrected resize handle logic with consolidated width/height calculations (#55)
- Fixed grid calculation order (position before size) for accurate snapping (#55)
- Fixed transition property to include all animated properties (width, height, top, left) (#55)

### Improved
- Cleaner, more modern appearance with SVG resize handles replacing background-color styles (#55)
- Better visual feedback with opacity states (hidden by default, visible on panel hover, full opacity on handle hover) (#55)
- Enhanced UX with properly centered edge handles and appropriate aspect ratios (#55)
- Performance optimization by avoiding object creation during high-frequency mouse events (#55)

## [0.1.3] - 2025-11-24

### Added
- `panelMap` (Map<PanelId, PanelCoordinate>) for O(1) panel lookups by ID (#53)
- `usePanel(id)` hook for convenient access to individual panel data (#53)
- `lockPanelSize(id)` and `unlockPanelSize(id)` methods for dynamic panel size locking (#53)
- Interactive checkbox UI in demo stories to toggle panel size lock status (#53)

### Changed
- Refactored state management from `useState` to `useReducer` for improved testability and extensibility (#52)
- Moved panel position calculation logic into reducer for better performance (#52)
- Standardized all panel ID type references to use `PanelId` type instead of inline `number | string` (#53)
- Updated demo `PanelContent` component to use `usePanel` hook for efficient state access (#53)

### Improved
- Better performance for panel lookups with O(1) access via `panelMap` (#53)
- Reduced `addPanel` function dependency array - no longer recreates when panels change (#52)
- Enhanced debugging and state tracking with explicit action types in reducer (#52)
- Improved code consistency and maintainability with centralized type definitions (#53)

## [0.1.2] - 2025-11-23

### Changed
- Modernized package configuration to follow JavaScript library packaging best practices (#50)
- Enhanced `exports` field with `module` condition for better bundler optimization (#50)
- Added nested `import`/`require` conditions with separate type definitions (`.d.cts` for CJS, `.d.mts` for ESM) (#50)
- Enabled unbundle mode to preserve source structure (43 files vs 7 bundled files) for optimal tree-shaking (#50)
- Added `sideEffects` field to prevent CSS from being incorrectly tree-shaken (#50)
- Added `./package.json` export for package metadata access (#50)
- Improved TypeScript type resolution with separate declaration files for each module format (#50)

### Improved
- Better tree-shaking for consumers - only load modules that are actually imported (#50)
- Module-level code splitting and caching for more efficient bundling (#50)
- More intuitive debugging with preserved file structure (#50)
- Future-proof architecture for upcoming features (#50)

## [0.1.1] - 2025-11-20

### Added
- `lockSize` option to lock panel sizes and prevent resizing (#40)
- `user-select: none` applied while dragging or resizing to prevent text selection (#42)
- Storybook for interactive documentation and live examples (#43)
- Position data attributes (`data-panel-x`, `data-panel-y`, `data-panel-w`, `data-panel-h`) on panel elements (#44)
- Dark mode styling examples in Storybook documentation (#46)
- Automated npm publishing workflow using OIDC trusted publishing (#47)
- GitHub Actions workflow for publishing packages on version tag push with automatic provenance attestations (#47)
- Storybook introduction page and improved story organization (#45)

### Changed
- CI workflow now tests against Node.js 20.x, 22.x, and 24.x (#37)
- Updated Biome configuration files (#39)
- Improved panel styling with reorganized CSS (#44)

### Fixed
- Storybook story organization and navigation structure (#45)

## [0.1.0] - 2025-11-12

### Added
- Initial release of PanelGrid
- Drag and drop panel repositioning with snap-to-grid behavior
- Resizable panels with visual feedback
- Ghost panel preview during drag/resize operations
- Performance-optimized direct DOM manipulation for high-frequency interactions
- TypeScript support with comprehensive type definitions
- Customizable rearrangement logic via `rearrangement` prop
- ESM and CommonJS build outputs
- Separate CSS import (`panelgrid/styles.css`)
- React 18 and React 19 support
- Comprehensive test coverage (101 tests)
- `PanelGridProvider` component for state management
- `PanelGridRenderer` component for rendering grid layout
- `usePanelGridControls` hook for panel manipulation (add, remove, export)
- Animation system for smooth panel transitions
- Collision detection and resolution
- Grid boundary constraints
