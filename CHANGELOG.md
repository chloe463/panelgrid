# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
