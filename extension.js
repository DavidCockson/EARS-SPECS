// EARS Specs — VS Code extension entry point.
// Provides: bundled syntax coloring (decorations), a live "Requirements" tree that
// auto-classifies each line into one of the 5 EARS archetypes by its leading keyword,
// an "Organize Document" command, and a "New Spec" scaffolder.

const vscode = require('vscode');

// The 5 EARS archetypes, in canonical order, plus a catch-all bucket.
const TYPES = [
  { key: 'ubiquitous', label: 'Ubiquitous' },
  { key: 'state', label: 'State-Driven' },
  { key: 'event', label: 'Event-Driven' },
  { key: 'option', label: 'Option-Driven' },
  { key: 'unwanted', label: 'Unwanted' },
  { key: 'unclassified', label: 'Unclassified' }
];

const isEarsDoc = (doc) => !!doc && doc.fileName.endsWith('.ears.md');

// ---------------------------------------------------------------------------
// Classification — the heart of "organise themselves". The EARS type is fully
// determined by the opening keyword, so no manual tags are required.
// ---------------------------------------------------------------------------
function classify(rawLine) {
  // Markdown headings (## Foo) are structure, not requirements.
  if (/^\s*#{1,6}\s/.test(rawLine)) return null;

  // Strip an optional list marker, a [DRAFT]/[STABLE] status, and a #Archetype tag.
  const text = rawLine
    .replace(/^\s*[-*]\s+/, '')
    .replace(/^\s*\[(DRAFT|STABLE)\]\s*/i, '')
    .replace(/^\s*#[\w-]+\s*/, '')
    .trim();

  if (!text) return null; // blank line

  if (/^if\b/i.test(text) && /\bthen\b/i.test(text)) return 'unwanted';
  if (/^when\b/i.test(text)) return 'event';
  if (/^while\b/i.test(text)) return 'state';
  if (/^where\b/i.test(text)) return 'option';
  if (/^the\b/i.test(text) && /\bshall\b/i.test(text)) return 'ubiquitous';
  if (/\bshall\b/i.test(text)) return 'ubiquitous'; // lenient fallback
  return 'unclassified';
}

function statusOf(rawLine) {
  const m = rawLine.match(/\[(DRAFT|STABLE)\]/i);
  return m ? m[1].toUpperCase() : null;
}

// Parse a document body into { line, text, type, status } requirement records.
function parseRequirements(doc) {
  const out = [];
  for (let i = 0; i < doc.lineCount; i++) {
    const raw = doc.lineAt(i).text;
    const type = classify(raw);
    if (!type) continue;
    out.push({ line: i, text: raw.trim(), type, status: statusOf(raw) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Syntax coloring via editor decorations (self-contained; no third-party ext).
// ---------------------------------------------------------------------------
let decos;
function buildDecorations() {
  const t = (opts) => vscode.window.createTextEditorDecorationType(opts);
  return {
    keyword: { re: /\b(While|When|Where|If|then)\b/gi, deco: t({ color: '#66b3ff', fontWeight: 'bold' }) },
    core: { re: /\b(The|shall)\b/gi, deco: t({ color: '#f8f9fa', fontWeight: 'bold' }) },
    variable: { re: /<[^<>\r\n]+>/g, deco: t({ color: '#ff6b6b', fontStyle: 'italic' }) },
    draft: { re: /\[DRAFT\]/g, deco: t({ backgroundColor: '#4a3512', color: '#fcc419', borderRadius: '4px' }) },
    stable: { re: /\[STABLE\]/g, deco: t({ backgroundColor: '#1e4620', color: '#51cf66', borderRadius: '4px' }) }
  };
}

function updateDecorations(editor) {
  if (!editor || !isEarsDoc(editor.document)) return;
  const text = editor.document.getText();
  for (const key of Object.keys(decos)) {
    const { re, deco } = decos[key];
    const ranges = [];
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      ranges.push(new vscode.Range(
        editor.document.positionAt(m.index),
        editor.document.positionAt(m.index + m[0].length)
      ));
    }
    editor.setDecorations(deco, ranges);
  }
}

// ---------------------------------------------------------------------------
// Tree view — groups the active spec's requirements under their archetype.
// ---------------------------------------------------------------------------
class EarsOutlineProvider {
  constructor() {
    this._onDidChange = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChange.event;
    this.uri = null;
  }

  refresh() {
    const ed = vscode.window.activeTextEditor;
    if (ed && isEarsDoc(ed.document)) this.uri = ed.document.uri;
    this._onDidChange.fire();
  }

  getTreeItem(item) { return item; }

  getChildren(element) {
    const doc = vscode.workspace.textDocuments.find(
      (d) => this.uri && d.uri.toString() === this.uri.toString()
    );
    if (!doc) {
      const hint = new vscode.TreeItem('Open a .ears.md file to see requirements');
      hint.iconPath = new vscode.ThemeIcon('info');
      return element ? [] : [hint];
    }
    const reqs = parseRequirements(doc);

    if (!element) {
      // Root: one node per archetype that actually has requirements.
      return TYPES
        .map((ty) => ({ ty, items: reqs.filter((r) => r.type === ty.key) }))
        .filter((g) => g.items.length > 0)
        .map((g) => {
          const node = new vscode.TreeItem(
            `${g.ty.label} (${g.items.length})`,
            vscode.TreeItemCollapsibleState.Expanded
          );
          node.contextValue = 'earsGroup';
          node._group = g.ty.key;
          node.iconPath = new vscode.ThemeIcon('symbol-namespace');
          return node;
        });
    }

    // Children: requirement lines for the expanded archetype.
    return reqs
      .filter((r) => r.type === element._group)
      .map((r) => {
        const label = r.text.replace(/^\[(DRAFT|STABLE)\]\s*/i, '').replace(/^#[\w-]+\s*/, '');
        const node = new vscode.TreeItem(
          label.length > 90 ? label.slice(0, 87) + '…' : label,
          vscode.TreeItemCollapsibleState.None
        );
        node.description = r.status || '';
        node.iconPath = new vscode.ThemeIcon(
          r.status === 'STABLE' ? 'pass-filled' : r.status === 'DRAFT' ? 'circle-large-outline' : 'circle-outline'
        );
        node.command = { command: 'ears.goto', title: 'Go to', arguments: [this.uri, r.line] };
        return node;
      });
  }
}

// ---------------------------------------------------------------------------
// Organize command — rewrite the active spec into 5 sorted sections.
// ---------------------------------------------------------------------------
async function organizeDocument() {
  const ed = vscode.window.activeTextEditor;
  if (!ed || !isEarsDoc(ed.document)) {
    vscode.window.showWarningMessage('EARS: open a .ears.md file first.');
    return;
  }
  const doc = ed.document;

  // Preserve the first H1 title if present.
  let title = '# Requirements';
  for (let i = 0; i < doc.lineCount; i++) {
    if (/^#\s+\S/.test(doc.lineAt(i).text)) { title = doc.lineAt(i).text.trim(); break; }
  }

  const reqs = parseRequirements(doc);
  const lines = [title, ''];
  for (const ty of TYPES) {
    const items = reqs.filter((r) => r.type === ty.key);
    if (!items.length) continue;
    // STABLE first, then DRAFT, then untagged — keeps "done" work at the top.
    const rank = (s) => (s === 'STABLE' ? 0 : s === 'DRAFT' ? 1 : 2);
    items.sort((a, b) => rank(a.status) - rank(b.status));
    lines.push(`## ${ty.label}`, '');
    for (const r of items) lines.push(r.text);
    lines.push('');
  }

  const edit = new vscode.WorkspaceEdit();
  const fullRange = new vscode.Range(0, 0, doc.lineCount, 0);
  edit.replace(doc.uri, fullRange, lines.join('\n').replace(/\n+$/, '\n'));
  await vscode.workspace.applyEdit(edit);
  vscode.window.showInformationMessage(`EARS: organised ${reqs.length} requirement(s) into ${new Set(reqs.map(r => r.type)).size} section(s).`);
}

// ---------------------------------------------------------------------------
// New Spec scaffolder.
// ---------------------------------------------------------------------------
const TEMPLATE = `# <Project> Requirements

> Status legend: [DRAFT] = under discussion · [STABLE] = agreed
> Tip: type e-ubiq / e-state / e-event / e-opt / e-err then Tab. Run "EARS: Organize Document" when done.

[DRAFT] The <system> shall <response>.
[DRAFT] While <state>, the <system> shall <response>.
[DRAFT] When <trigger>, the <system> shall <response>.
[DRAFT] Where <feature>, the <system> shall <response>.
[DRAFT] If <problem>, then the <system> shall <response>.
`;

async function newSpec() {
  const name = await vscode.window.showInputBox({
    prompt: 'New EARS spec file name',
    value: 'requirements.ears.md',
    validateInput: (v) => (v && v.endsWith('.ears.md') ? null : 'Name must end with .ears.md')
  });
  if (!name) return;
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) { vscode.window.showWarningMessage('EARS: open a folder first.'); return; }
  const uri = vscode.Uri.joinPath(folders[0].uri, name);
  await vscode.workspace.fs.writeFile(uri, Buffer.from(TEMPLATE, 'utf8'));
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc);
}

// ---------------------------------------------------------------------------
function activate(context) {
  decos = buildDecorations();
  const provider = new EarsOutlineProvider();
  context.subscriptions.push(vscode.window.registerTreeDataProvider('earsOutline', provider));

  let timer;
  const scheduleUpdate = () => {
    const ed = vscode.window.activeTextEditor;
    updateDecorations(ed);
    clearTimeout(timer);
    timer = setTimeout(() => provider.refresh(), 250);
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('ears.organize', organizeDocument),
    vscode.commands.registerCommand('ears.newSpec', newSpec),
    vscode.commands.registerCommand('ears.refreshOutline', () => provider.refresh()),
    vscode.commands.registerCommand('ears.goto', async (uri, line) => {
      const doc = await vscode.workspace.openTextDocument(uri);
      const ed = await vscode.window.showTextDocument(doc);
      const pos = new vscode.Position(line, 0);
      ed.selection = new vscode.Selection(pos, pos);
      ed.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
    }),
    vscode.window.onDidChangeActiveTextEditor(scheduleUpdate),
    vscode.workspace.onDidChangeTextDocument((e) => {
      const ed = vscode.window.activeTextEditor;
      if (ed && e.document === ed.document) scheduleUpdate();
    }),
    vscode.workspace.onDidSaveTextDocument(() => provider.refresh())
  );

  scheduleUpdate();
}

function deactivate() {}

module.exports = { activate, deactivate };
