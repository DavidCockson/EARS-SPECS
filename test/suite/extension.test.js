// Integration tests: run inside a real VS Code instance via test/runTest.js, with a
// temporary folder open as the workspace. Parsing details live in test/unit.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const { organize } = require('../../src/ears');

const workspaceDir = () => vscode.workspace.workspaceFolders[0].uri.fsPath;

suite('Extension Test Suite', () => {
	test('Extension should activate', async () => {
		const ext = vscode.extensions.getExtension('davidcockson.ears-specs');
		assert.ok(ext, 'extension davidcockson.ears-specs not found');
		await ext.activate();
		assert.ok(ext.isActive);
	});

	test('Organize command should rewrite the active spec', async () => {
		const file = path.join(workspaceDir(), 'organize.ears.md');
		const initialContent = `# Test Title
> Intro note that must stay at the top.

[DRAFT] The <system> shall <response>.
[STABLE] When <trigger>, the <system> shall <response>.
[DRAFT] While <state>, the <system> shall <response>.
[DRAFT] Where <feature>, the <system> shall <response>.
[STABLE] If <problem>, then the <system> shall <response>.
> Tip: Just testing the unclassified stuff.`;
		fs.writeFileSync(file, initialContent);

		const doc = await vscode.workspace.openTextDocument(file);
		await vscode.window.showTextDocument(doc);
		try {
			await vscode.commands.executeCommand('ears.organize');

			const text = doc.getText();
			assert.strictEqual(text, organize(initialContent).text);
			assert.ok(text.startsWith('# Test Title\n> Intro note that must stay at the top.\n'), 'Intro block moved');
			for (const section of ['Ubiquitous', 'State-Driven', 'Event-Driven', 'Option-Driven', 'Unwanted', 'Unclassified']) {
				assert.ok(text.includes(`## ${section}`), `Missing ${section} section`);
			}
			assert.ok(text.includes('> Tip: Just testing the unclassified stuff.'), 'Unclassified content lost');
		} finally {
			// Revert so closing never blocks on a "save changes?" prompt.
			await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
		}
	});

	test('New Spec should refuse to overwrite and create the template', async () => {
		const existing = path.join(workspaceDir(), 'existing.ears.md');
		fs.writeFileSync(existing, 'keep me\n');

		const originalShowInputBox = vscode.window.showInputBox;
		let validation;
		vscode.window.showInputBox = async (options) => {
			validation = await options.validateInput('existing.ears.md');
			return 'fresh.ears.md';
		};
		try {
			await vscode.commands.executeCommand('ears.newSpec');
		} finally {
			vscode.window.showInputBox = originalShowInputBox;
		}

		assert.match(validation, /already exists/);
		assert.strictEqual(fs.readFileSync(existing, 'utf8'), 'keep me\n');
		const created = fs.readFileSync(path.join(workspaceDir(), 'fresh.ears.md'), 'utf8');
		assert.ok(created.includes('[DRAFT] When <trigger>, the <system> shall <response>.'), 'Template not written');
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	});
});
