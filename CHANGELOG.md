# Changelog

All notable changes to **EARS Specs** are documented here.

## [0.3.0] — Unreleased

### Fixed
- **New Spec** no longer silently overwrites an existing file; it also rejects paths and asks which folder to use in multi-root workspaces.
- **Organize Document** keeps the intro block (title, notes) above the first requirement instead of moving it under *Unclassified*, preserves CRLF line endings, and reports when the edit cannot be applied.
- Highlighting is legible on light themes (*The / shall* were near-white) and applies to every visible `.ears.md` editor, not just the active one.
- `If …, the system shall …` (without *then*) is classified as Unwanted; status is read only from a leading `[DRAFT]` / `[STABLE]`; numbered list items are recognised.
- Sidebar labels strip list markers, keep their collapse state across refreshes, and show the full line as a tooltip.

### Changed
- Activates only in workspaces containing `.ears.md` files or when Markdown opens, instead of on every startup.
- Parsing logic moved to `src/ears.js` with a fast unit-test suite (`npm run test:unit`); CI now runs unit and integration tests on every push, pull request and release.
- Test files and local settings are no longer included in the `.vsix`.

## [0.2.2] — 2026-06-07

- Aligned the New Spec template placeholders with the snippets.
- Added an integration test suite.

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
