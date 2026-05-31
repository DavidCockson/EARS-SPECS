# EARS Specs 👂

A friendly VS Code helper for writing **EARS** requirements — the clear, no-arguments way to write down what a system should do. It adds colours, autocomplete, and a sidebar that sorts your requirements for you.

Written so that **non-technical people can install and use it**. If you can copy a file and click a few buttons, you can use this.

---

## Part 1 — Install it (pick your computer)

You only do this **once**. There are two ways: the **clicking way** (easiest) and the **command way** (for terminal folks). Both work on Windows, Mac, and Linux.

### Step 1 — Download the file

1. Go to the **Releases page**: <https://github.com/davidcockson-compliance/EARS-SPECS/releases>
2. Under the latest version, click the file ending in **`.vsix`** (e.g. `ears-specs-0.1.1.vsix`) to download it. It'll land in your **Downloads** folder.

### Step 2 — Install the file

**👉 The clicking way (recommended, same on every computer):**

1. Open **VS Code**.
2. Click the **Extensions** icon on the left (it looks like 4 squares), or press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd> (<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd> on Mac).
3. Click the **`...`** menu at the top of that panel → choose **Install from VSIX…**
4. Find the `.vsix` file you downloaded and select it.

**👉 The command way (terminal):** open a terminal and run **one** line:

| Computer | Command |
|----------|---------|
| **Linux** | `code --install-extension ~/Downloads/ears-specs-0.1.1.vsix` |
| **Mac** | `code --install-extension ~/Downloads/ears-specs-0.1.1.vsix` |
| **Windows** (PowerShell) | `code --install-extension $HOME\Downloads\ears-specs-0.1.1.vsix` |

> **Mac tip:** if it says `code: command not found`, open VS Code → press <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> → type `Shell Command: Install 'code' command in PATH` → press Enter, then try again.

### Step 3 — Restart

**Close VS Code completely and open it again.** Done — it's installed for good, in every window.

### To check it worked

Make a file whose name ends in **`.ears.md`** (for example `test.ears.md`), open it, and type:

```
[DRAFT] When <user logs in>, the system shall <check the password>.
```

You should see colours appear and an **ear icon** 👂 show up on the left toolbar. That's it!

---

## Part 2 — The commands (what you can do)

### ✍️ Autocomplete shortcuts (snippets)

Type one of these and press <kbd>Tab</kbd>. It fills in the sentence template, and <kbd>Tab</kbd> again jumps you to the next `<blank>` to fill in.

| Type this | You get | EARS type |
|-----------|---------|-----------|
| `e-ubiq` + Tab | `The <system> shall <response>` | Always-on rule |
| `e-state` + Tab | `While <state>, the <system> shall <response>` | During a state |
| `e-event` + Tab | `When <trigger>, the <system> shall <response>` | When something happens |
| `e-opt` + Tab | `Where <feature>, the <system> shall <response>` | If a feature is present |
| `e-err` + Tab | `If <problem>, then the <system> shall <response>` | Handling problems |
| `e-draft` + Tab | `[DRAFT] ` | Mark as still-being-decided |
| `e-stable` + Tab | `[STABLE] ` | Mark as agreed/final |

### 👂 The sidebar (Requirements panel)

Click the **ear icon** on the left toolbar. It shows all the requirements in your file, **grouped by type automatically**. 
- A **filled dot** = STABLE (agreed). A **hollow dot** = DRAFT (still deciding).
- **Click any line** to jump straight to it in your file.

### 🎛️ The menu commands

Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> (<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> on Mac) to open the command menu, then type the name:

| Command | What it does |
|---------|--------------|
| **EARS: Organize Document** | Tidies your file into neat sections, one per EARS type, with the agreed (STABLE) ones first. Run it when you're done drafting. |
| **EARS: New Spec File** | Creates a fresh requirements file with examples ready to edit. *(You need a folder open first — File → Open Folder.)* |
| **EARS: Refresh Outline** | Re-reads the sidebar, in case it looks out of date. |

---

## Part 3 — How it all works (the explanation)

### What is EARS?

**EARS** = *Easy Approach to Requirements Syntax*. It's a way of writing requirements so they're impossible to misread. Instead of a vague paragraph, every requirement is one short sentence in one of **5 shapes**:

| # | Shape | Template | Example |
|---|-------|----------|---------|
| 1 | **Ubiquitous** (always true) | `The <system> shall <response>` | The system shall log all logins. |
| 2 | **State-Driven** (during a state) | `While <state>, the <system> shall <response>` | While the session is active, the system shall refresh the token. |
| 3 | **Event-Driven** (on an event) | `When <trigger>, the <system> shall <response>` | When the user clicks login, the system shall check the password. |
| 4 | **Option-Driven** (if a feature exists) | `Where <feature>, the <system> shall <response>` | Where two-factor is enabled, the system shall require a code. |
| 5 | **Unwanted** (handling problems) | `If <problem>, then the <system> shall <response>` | If login fails 3 times, then the system shall lock the account. |

### How the extension helps

- **`.ears.md` files** — Your requirements live in normal Markdown files whose names end in `.ears.md`. The extension switches on its features only for those files, so it never interferes with your other work.

- **Colours (highlighting)** — As you type, the extension paints the important words: the trigger words (*When / While / Where / If / then*) in blue, the backbone words (*The / shall*) in white, your `<blanks>` in red, and the `[DRAFT]` / `[STABLE]` labels as coloured badges. This is done with VS Code "decorations" — it's built in, so you don't need any other extension.

- **It sorts itself** — Here's the clever bit: the extension figures out which of the 5 types a line is **just from its first word**. A line starting with *When* is Event-Driven; *While* is State-Driven; *If… then* is Unwanted, and so on. That's why the sidebar can group everything automatically — **you never have to tag anything by hand.**

- **The sidebar** reads your open file, classifies each line that way, and lists them under their type. **Organize Document** does the same but actually rewrites the file into tidy sections.

- **Status badges** — Put `[DRAFT]` or `[STABLE]` at the start of a line to track whether a requirement is still being discussed or finalised. The sidebar shows this as hollow vs filled dots.

### Why this is nice for "spec-driven" work

You draft freely, the tool keeps everything organised and consistent, and at any moment you can glance at the sidebar to see what's agreed and what's still open. No spreadsheets, no manual sorting.

---

## For developers (optional)

Want to change the extension or build it yourself?

```bash
git clone https://github.com/davidcockson-compliance/EARS-SPECS.git
cd EARS-SPECS
code .          # open in VS Code, then press F5 to test it in a sandbox window
```

To build an installable file:

```bash
npm install -g @vscode/vsce
vsce package    # creates ears-specs-x.y.z.vsix
```

Pushing a git tag like `v0.1.2` automatically builds the `.vsix` and publishes it as a GitHub Release (see `.github/workflows/release.yml`).

## License

MIT
