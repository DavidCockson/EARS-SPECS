# Changelog

All notable changes to **EARS Specs** are documented here.

## [0.2.1] — 2026-06-01

Documentation and listing polish — no functional changes.

- Rewrote the README so the one-click **Marketplace** install leads; manual `.vsix`, Open VSX and build-from-source methods moved to a secondary section.
- Added a screenshot and replaced the retired VS Marketplace status badges with working ones.
- Neutralised the README tone for a general engineering audience.

## [0.2.0] — 2026-05-31

First public release.

- Extension icon and Marketplace listing metadata.
- Syntax colouring for EARS keywords, `<variables>`, and `[DRAFT]`/`[STABLE]` badges (bundled — no third-party extension needed).
- Snippets for all 5 EARS archetypes with Tab-stops (`e-ubiq`, `e-state`, `e-event`, `e-opt`, `e-err`, plus `e-draft`/`e-stable`).
- Snippet Tab-completion enabled for Markdown.
- **Requirements** sidebar that auto-classifies each line into its EARS archetype by its leading keyword and groups them, with DRAFT/STABLE status.
- **EARS: Organize Document** command — rewrites a file into sorted sections by type.
- **EARS: New Spec File** command — scaffolds a templated `.ears.md`.

## [0.1.x] — pre-release

- Initial extension scaffold, snippets, decorations, tree view, and automated `.vsix` release pipeline.
