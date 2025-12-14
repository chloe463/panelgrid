# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.4.0](https://github.com/chloe463/panelgrid/compare/v0.1.0...v0.4.0) (2025-12-14)


### ⚠ BREAKING CHANGES

* The PanelGridRenderer now accepts a component type as children instead of a render function.

Before:
```tsx
<PanelGridRenderer>{(id) => <PanelContent id={id} />}</PanelGridRenderer>
```

After:
```tsx
<PanelGridRenderer>{PanelContent}</PanelGridRenderer>
```

For custom props, users should create wrapper components marked with "use client":
```tsx
"use client";
function CustomPanel({ id }: { id: PanelId }) {
  return <PanelContent id={id} showLockButton />;
}

<PanelGridRenderer>{CustomPanel}</PanelGridRenderer>
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

* docs: Update CHANGELOG for v0.2.0 RSC compatibility

Add detailed changelog entry for React Server Components compatibility,
including breaking changes, migration guide, and PR reference.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

* v0.2.0

* docs: Update README for v0.2.0 RSC compatibility

- Add RSC feature to features list
- Update all code examples to use new component reference API
- Add dedicated Next.js App Router / RSC section
- Update PanelGridRenderer API documentation
- Include examples of proper 'use client' usage

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
* The PanelGridRenderer now accepts a component type as children instead of a render function.

Before:
```tsx
<PanelGridRenderer>{(id) => <PanelContent id={id} />}</PanelGridRenderer>
```

After:
```tsx
<PanelGridRenderer>{PanelContent}</PanelGridRenderer>
```

For custom props, users should create wrapper components marked with "use client":
```tsx
"use client";
function CustomPanel({ id }: { id: PanelId }) {
  return <PanelContent id={id} showLockButton />;
}

<PanelGridRenderer>{CustomPanel}</PanelGridRenderer>
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-authored-by: Claude <noreply@anthropic.com>

* Update CHANGELOG for v0.2.0 RSC compatibility ([#59](https://github.com/chloe463/panelgrid/issues/59)) ([356b60f](https://github.com/chloe463/panelgrid/commit/356b60f0213ee7c41ae28ee24538e3b49d83f8c5))


### Added

* Add dark mode styling examples to Storybook ([#46](https://github.com/chloe463/panelgrid/issues/46)) ([50e3f87](https://github.com/chloe463/panelgrid/commit/50e3f87340a7e8b3d971753378453784777aa270))
* Add lockSize option to lock panel sizes ([#40](https://github.com/chloe463/panelgrid/issues/40)) ([3c5b1b3](https://github.com/chloe463/panelgrid/commit/3c5b1b332b41a1bcf8c2a7398e4f3d1e6f620c3f))
* Add multiple resize handles support ([#55](https://github.com/chloe463/panelgrid/issues/55)) ([6ab51e4](https://github.com/chloe463/panelgrid/commit/6ab51e4e2a7628a550be59bcffbd6e55e0db1b17))
* Add npm trusted publishing workflow with OIDC ([#47](https://github.com/chloe463/panelgrid/issues/47)) ([1f97f53](https://github.com/chloe463/panelgrid/commit/1f97f535d10847701500cd7e59019e03a527fe6c)), closes [#38](https://github.com/chloe463/panelgrid/issues/38)
* Add panelMap, usePanel hook, and interactive size lock controls ([#53](https://github.com/chloe463/panelgrid/issues/53)) ([7c90646](https://github.com/chloe463/panelgrid/commit/7c90646aa1978aa6bd4843babc4d633d5e9ef158))
* Add position data attributes and improve panel styling ([#44](https://github.com/chloe463/panelgrid/issues/44)) ([256455c](https://github.com/chloe463/panelgrid/commit/256455ca5569a167f6be01ac91d626761de1bc96))
* Add React Server Components (RSC) compatibility ([#58](https://github.com/chloe463/panelgrid/issues/58)) ([33f0516](https://github.com/chloe463/panelgrid/commit/33f051631d6a0a4bc398535e42f42fe1a82063d0))
* Apply 'user-select: none' while dragging or resizing ([#42](https://github.com/chloe463/panelgrid/issues/42)) ([1561756](https://github.com/chloe463/panelgrid/commit/15617566625fb60d8ea61c803108e49ecdecf22c))
* Export helper functions for custom rearrangement logic ([#63](https://github.com/chloe463/panelgrid/issues/63)) ([900985e](https://github.com/chloe463/panelgrid/commit/900985e2bae0eaccb11fc625622f69ca29127d58))
* Install and configure Storybook for interactive documentation ([#43](https://github.com/chloe463/panelgrid/issues/43)) ([dee0d5f](https://github.com/chloe463/panelgrid/commit/dee0d5ff61e765be76d8a8b18da23166992210c0))
* Use CSS mask for customizable resize handle color ([#57](https://github.com/chloe463/panelgrid/issues/57)) ([9234b6e](https://github.com/chloe463/panelgrid/commit/9234b6e7970f8d4f666e2f6000e5ecfe8e168ada)), closes [#000](https://github.com/chloe463/panelgrid/issues/000)


### Fixed

* Add explicit npm tag specification to publish workflow ([#48](https://github.com/chloe463/panelgrid/issues/48)) ([d059474](https://github.com/chloe463/panelgrid/commit/d059474ae2e8664dee4cc904f6cf1170ef3a2325))
* Improve Storybook organization and add introduction ([#45](https://github.com/chloe463/panelgrid/issues/45)) ([47bcb3d](https://github.com/chloe463/panelgrid/commit/47bcb3d6c2a1bd32c8fea55376d373826e6f0a9d))
* Resolve collisions in complex chain reaction scenarios ([#60](https://github.com/chloe463/panelgrid/issues/60)) ([e91478a](https://github.com/chloe463/panelgrid/commit/e91478aebc420e796bc65f925b29f48d818d3a58))


### Changed

* Replace useState with useReducer in usePanelGrid ([#52](https://github.com/chloe463/panelgrid/issues/52)) ([7b1b931](https://github.com/chloe463/panelgrid/commit/7b1b9316488e328a07a66295ee49fdeb2b42c1e3))

## [0.1.0](https://github.com/chloe463/panelgrid/compare/273de97b963075f46529afc7a3b4ee9727559792...v0.1.0) (2025-11-12)


### Added

* **Panel:** Add initial implementation of panelist ([#2](https://github.com/chloe463/panelgrid/issues/2)) ([273de97](https://github.com/chloe463/panelgrid/commit/273de97b963075f46529afc7a3b4ee9727559792))
* **Panel:** Make it possible to resolve collision and rearrange panels ([#4](https://github.com/chloe463/panelgrid/issues/4)) ([6326130](https://github.com/chloe463/panelgrid/commit/63261305e115c2a814ce9d16b24e3432cd818b8b))
* **rearrangement:** Allow overriding rearrangement logic ([#21](https://github.com/chloe463/panelgrid/issues/21)) ([ffb0b16](https://github.com/chloe463/panelgrid/commit/ffb0b1627c9552b6286ffe91de2aa838cb5c9c91))
* **rearrangement:** Allow overriding rearrangement logic ([#22](https://github.com/chloe463/panelgrid/issues/22)) ([8af6de3](https://github.com/chloe463/panelgrid/commit/8af6de3a81343bd4753d131b6c1be50b73875a78))


### Fixed

* **Panel:** Fix dnd ([#15](https://github.com/chloe463/panelgrid/issues/15)) ([66835bd](https://github.com/chloe463/panelgrid/commit/66835bdfc211de81ecc8c7351c2ca2cee9e8afa2))
* Prevent panels from overflowing beyond grid boundaries ([#24](https://github.com/chloe463/panelgrid/issues/24)) ([09ef1aa](https://github.com/chloe463/panelgrid/commit/09ef1aa4dc265422737c2f654f89f9971330b1b1))


### Changed

* **Panel:** Refactor ([#10](https://github.com/chloe463/panelgrid/issues/10)) ([763989a](https://github.com/chloe463/panelgrid/commit/763989a3f6be794f83cf9b97b1b2a8b2c3c8711c))
* Rename Panelist to PanelGrid throughout codebase ([#28](https://github.com/chloe463/panelgrid/issues/28)) ([bb5c31b](https://github.com/chloe463/panelgrid/commit/bb5c31bb9bb3e4130dce3772062c271c506559b6))
* Use local variables for isDragging and isResizing ([#30](https://github.com/chloe463/panelgrid/issues/30)) ([3ecc6b2](https://github.com/chloe463/panelgrid/commit/3ecc6b2f864b8e7050b2bdab57756815c5629063))
