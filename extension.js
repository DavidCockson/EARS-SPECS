// EARS Specs — VS Code extension entry point.
// Provides: bundled syntax coloring (decorations), a live "Requirements" tree that
// auto-classifies each line into one of the 5 EARS archetypes by its leading keyword,
// an "Organize Document" command, and a "New Spec" scaffolder.

const vscode = require('vscode');
const { TYPES, isSpecFileName, parseSpec, organize, validateSpecName } = require('./src/ears');

const isEarsDoc = (doc) => !!doc && isSpecFileName(doc.fileName);
const docLines = (doc) => doc.getText().split(/\r?\n/);

// ---------------------------------------------------------------------------
// Syntax coloring via editor decorations (self-contained; no third-party ext).
// Each style has light and dark variants so it stays legible in every theme.
// ---------------------------------------------------------------------------
const HIGHLIGHTS = [
  {
    re: /\b(?:While|When|Where|If|then)\b/gi,
    style: { fontWeight: 'bold', light: { color: '#0b62c4' }, dark: { color: '#66b3ff' } }
  },
  // The backbone keeps the theme's own foreground colour; bold alone marks it.
  { re: /\b(?:The|shall)\b/gi, style: { fontWeight: 'bold' } },
  {
    re: /<[^<>\r\n]+>/g,
    style: { fontStyle: 'italic', light: { color: '#c92a2a' }, dark: { color: '#ff6b6b' } }
  },
  {
    re: /\[DRAFT\]/gi,
    style: {
      borderRadius: '4px',
      light: { backgroundColor: '#fff3bf', color: '#8a5a00' },
      dark: { backgroundColor: '#4a3512', color: '#fcc419' }
    }
  },
  {
    re: /\[STABLE\]/gi,
    style: {
      borderRadius: '4px',
      light: { backgroundColor: '#d3f9d8', color: '#1e6b2a' },
      dark: { backgroundColor: '#1e4620', color: '#51cf66' }
    }
  }
];

function createHighlighters() {
  return HIGHLIGHTS.map(({ re, style }) => ({ re, deco: vscode.window.createTextEditorDecorationType(style) }));
}

function decorate(editor, highlighters) {
  const doc = editor.document;
  if (!isEarsDoc(doc)) return;
  const text = doc.getText();
  for (const { re, deco } of highlighters) {
    const ranges = [];
    for (const m of text.matchAll(re)) {
      ranges.push(new vscode.Range(doc.positionAt(m.index), doc.positionAt(m.index + m[0].length)));
    }
    editor.setDecorations(deco, ranges);
  }
}

// ---------------------------------------------------------------------------
// Tree view — groups the active spec's requirements under their archetype.
// ---------------------------------------------------------------------------
class EarsOutlineProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.uri = null;
    this.requirements = null; // parsed once per refresh; null while no spec is open
  }

  // Follow the active spec, but keep showing the last one while another editor has focus.
  refresh() {
    const ed = vscode.window.activeTextEditor;
    if (ed && isEarsDoc(ed.document)) this.uri = ed.document.uri;
    const key = this.uri && this.uri.toString();
    const doc = key && vscode.workspace.textDocuments.find((d) => d.uri.toString() === key);
    this.requirements = doc ? parseSpec(docLines(doc)).requirements : null;
    this._onDidChangeTreeData.fire();
  }

  dispose() {
    this._onDidChangeTreeData.dispose();
  }

  getTreeItem(item) {
    return item;
  }

  getChildren(element) {
    if (!element) return this.rootItems();
    return this.requirements
      .filter((r) => r.type === element.groupKey)
      .map((r) => {
        const node = new vscode.TreeItem(
          r.label.length > 90 ? r.label.slice(0, 87) + '…' : r.label,
          vscode.TreeItemCollapsibleState.None
        );
        node.description = r.status || '';
        node.tooltip = r.text;
        node.iconPath = new vscode.ThemeIcon(
          r.status === 'STABLE' ? 'pass-filled' : r.status === 'DRAFT' ? 'circle-large-outline' : 'circle-outline'
        );
        node.command = { command: 'ears.goto', title: 'Go to', arguments: [this.uri, r.line] };
        return node;
      });
  }

  // One node per archetype that actually has requirements.
  rootItems() {
    if (!this.requirements) return [hintItem('Open a .ears.md file to see requirements')];
    const groups = TYPES
      .map((ty) => ({ ty, count: this.requirements.filter((r) => r.type === ty.key).length }))
      .filter((g) => g.count > 0)
      .map(({ ty, count }) => {
        const node = new vscode.TreeItem(`${ty.label} (${count})`, vscode.TreeItemCollapsibleState.Expanded);
        node.id = `earsGroup:${ty.key}`; // stable id keeps the user's collapse state across refreshes
        node.contextValue = 'earsGroup';
        node.groupKey = ty.key;
        node.iconPath = new vscode.ThemeIcon('symbol-namespace');
        return node;
      });
    return groups.length ? groups : [hintItem('No requirements in this spec yet')];
  }
}

function hintItem(message) {
  const hint = new vscode.TreeItem(message);
  hint.iconPath = new vscode.ThemeIcon('info');
  return hint;
}

async function gotoRequirement(uri, line) {
  try {
    const doc = await vscode.workspace.openTextDocument(uri);
    // The line may be stale if the file changed since the outline last refreshed.
    const pos = doc.validatePosition(new vscode.Position(line, 0));
    const range = new vscode.Range(pos, pos);
    const ed = await vscode.window.showTextDocument(doc, { selection: range });
    ed.revealRange(range, vscode.TextEditorRevealType.InCenter);
  } catch (err) {
    vscode.window.showErrorMessage(`EARS: could not open requirement: ${err.message}`);
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
  const original = doc.getText();
  const result = organize(original);

  if (!result.requirements) {
    vscode.window.showInformationMessage('EARS: no requirements found to organise.');
    return;
  }
  if (result.text === original) {
    vscode.window.showInformationMessage('EARS: document is already organised.');
    return;
  }

  const edit = new vscode.WorkspaceEdit();
  edit.replace(doc.uri, new vscode.Range(doc.positionAt(0), doc.positionAt(original.length)), result.text);
  if (!(await vscode.workspace.applyEdit(edit))) {
    vscode.window.showErrorMessage('EARS: could not apply the reorganised document. Is the file read-only?');
    return;
  }
  vscode.window.showInformationMessage(
    `EARS: organised ${result.requirements} requirement(s) into ${result.sections} section(s).`
  );
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

async function fileExists(uri) {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

async function newSpec() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || !folders.length) {
    vscode.window.showWarningMessage('EARS: open a folder first.');
    return;
  }
  const folder = folders.length === 1
    ? folders[0]
    : await vscode.window.showWorkspaceFolderPick({ placeHolder: 'Folder for the new EARS spec' });
  if (!folder) return;

  const target = (name) => vscode.Uri.joinPath(folder.uri, name.trim());
  const problemWith = async (name) =>
    validateSpecName(name) || ((await fileExists(target(name))) ? `${name.trim()} already exists` : null);

  const name = await vscode.window.showInputBox({
    prompt: 'New EARS spec file name',
    value: 'requirements.ears.md',
    validateInput: problemWith
  });
  if (!name) return;

  // Re-check: the input box can be accepted before async validation settles.
  const problem = await problemWith(name);
  if (problem) {
    vscode.window.showErrorMessage(`EARS: ${problem}.`);
    return;
  }
  const uri = target(name);
  try {
    await vscode.workspace.fs.writeFile(uri, Buffer.from(TEMPLATE, 'utf8'));
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri));
  } catch (err) {
    vscode.window.showErrorMessage(`EARS: could not create ${name.trim()}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
function activate(context) {
  const highlighters = createHighlighters();
  context.subscriptions.push(...highlighters.map((h) => h.deco));
  const decorateVisible = () => vscode.window.visibleTextEditors.forEach((ed) => decorate(ed, highlighters));
  const decorateDocument = (doc) => vscode.window.visibleTextEditors
    .filter((ed) => ed.document === doc)
    .forEach((ed) => decorate(ed, highlighters));

  const provider = new EarsOutlineProvider();
  context.subscriptions.push(provider, vscode.window.registerTreeDataProvider('earsOutline', provider));

  let timer;
  const scheduleRefresh = () => {
    clearTimeout(timer);
    timer = setTimeout(() => provider.refresh(), 250);
  };
  context.subscriptions.push({ dispose: () => clearTimeout(timer) });

  context.subscriptions.push(
    vscode.commands.registerCommand('ears.organize', organizeDocument),
    vscode.commands.registerCommand('ears.newSpec', newSpec),
    vscode.commands.registerCommand('ears.refreshOutline', () => provider.refresh()),
    vscode.commands.registerCommand('ears.goto', gotoRequirement),
    vscode.window.onDidChangeVisibleTextEditors(decorateVisible),
    vscode.window.onDidChangeActiveTextEditor(scheduleRefresh),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (!isEarsDoc(e.document)) return;
      decorateDocument(e.document);
      scheduleRefresh();
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      if (provider.uri && doc.uri.toString() === provider.uri.toString()) scheduleRefresh();
    })
  );

  decorateVisible();
  provider.refresh();
}

function deactivate() {}

module.exports = { activate, deactivate };
