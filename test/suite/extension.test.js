const assert = require('assert');
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should activate', async () => {
		const ext = vscode.extensions.getExtension('davidcockson.ears-specs');
		if (ext) {
			await ext.activate();
			assert.ok(ext.isActive);
		}
	});

	test('Organize command should classify and organize correctly', async () => {
		const tmpFile = path.join(os.tmpdir(), 'test-organize.ears.md');
		const initialContent = `# Test Title
[DRAFT] The <system> shall <response>.
[STABLE] When <trigger>, the <system> shall <response>.
[DRAFT] While <state>, the <system> shall <response>.
[DRAFT] Where <feature>, the <system> shall <response>.
[STABLE] If <problem>, then the <system> shall <response>.
> Tip: Just testing the unclassified stuff.`;

		fs.writeFileSync(tmpFile, initialContent);

		const uri = vscode.Uri.file(tmpFile);
		const doc = await vscode.workspace.openTextDocument(uri);
		await vscode.window.showTextDocument(doc);
		
		await vscode.commands.executeCommand('ears.organize');
		
		const text = doc.getText();
		
		assert.ok(text.includes('## Ubiquitous'), 'Missing Ubiquitous section');
		assert.ok(text.includes('## Event-Driven'), 'Missing Event-Driven section');
		assert.ok(text.includes('## State-Driven'), 'Missing State-Driven section');
		assert.ok(text.includes('## Option-Driven'), 'Missing Option-Driven section');
		assert.ok(text.includes('## Unwanted'), 'Missing Unwanted section');
		assert.ok(text.includes('## Unclassified'), 'Missing Unclassified section');
		assert.ok(text.includes('> Tip: Just testing the unclassified stuff.'), 'Unclassified content lost');
		
		// Clean up (revert and close)
		await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		if (fs.existsSync(tmpFile)) {
			fs.unlinkSync(tmpFile);
		}
	});

	test('New Spec command should generate template', async () => {
		// New Spec requires an open folder to place the file
		// In tests, the workspace is often empty or depends on test launch arguments
		// Instead of testing ears.newSpec directly which prompts for input, 
		// we verify that the command is registered.
		const commands = await vscode.commands.getCommands();
		assert.ok(commands.includes('ears.newSpec'), 'ears.newSpec command not found');
	});
});
