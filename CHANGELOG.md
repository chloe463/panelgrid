# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
