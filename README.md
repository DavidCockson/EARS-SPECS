# EARS Specs

A reusable VS Code extension for drafting **EARS** (Easy Approach to Requirements Syntax) requirements in `*.ears.md` files. Requirements **organise themselves** into the 5 EARS archetypes — no manual tagging required, because the archetype is determined by the opening keyword.

## Features

| Feature | What it does |
|---------|--------------|
| **Syntax coloring** | Bundled — colors `When/While/Where/If/then`, `The/shall`, `<variables>`, and `[DRAFT]`/`[STABLE]` badges in any `.ears.md` file. No third-party extension needed. |
| **Snippets** | `e-ubiq`, `e-state`, `e-event`, `e-opt`, `e-err` (+ `e-draft`/`e-stable`). Type the prefix, press <kbd>Tab</kbd>, then Tab between the `<parts>`. |
| **Live Requirements tree** | Activity-bar panel that groups the open spec's requirements under their detected archetype. Click any line to jump to it. |
| **EARS: Organize Document** | Rewrites the current file into 5 sorted `##` sections (STABLE before DRAFT). Run it when a draft is complete. |
| **EARS: New Spec File** | Scaffolds a templated `.ears.md` in the current folder. |

## The 5 archetypes

```
Ubiquitous     The <system> shall <response>
State-Driven   While <state>, the <system> shall <response>
Event-Driven   When <trigger>, the <system> shall <response>
Option-Driven  Where <feature>, the <system> shall <response>
Unwanted       If <unwanted trigger>, then the <system> shall <response>
```

## Install & reuse from GitHub

This repo **is** the extension. To use it on any machine:

**Option A — quick test (no build):**
1. `git clone https://github.com/davidcockson-compliance/EARS-SPECS.git`
2. Open the folder in VS Code and press <kbd>F5</kbd> → an Extension Development Host window launches with EARS Specs active.

**Option B — install for daily use (build a .vsix):**
```bash
npm install -g @vscode/vsce      # one-time
cd EARS-SPECS
vsce package                     # produces ears-specs-0.1.0.vsix
code --install-extension ears-specs-0.1.0.vsix
```
Or in VS Code: Extensions panel → `…` menu → **Install from VSIX…**

**Option C — download a release:** attach the built `.vsix` to a GitHub Release, then on any machine just download it and run Option B's last command. No build tools required.

## License

MIT
