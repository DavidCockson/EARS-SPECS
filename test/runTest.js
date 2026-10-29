// Launches VS Code with the extension under development and runs the integration
// suite (test/suite) against a throwaway workspace folder.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runTests } = require('@vscode/test-electron');

async function main() {
	const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ears-specs-test-'));
	try {
		await runTests({
			extensionDevelopmentPath: path.resolve(__dirname, '../'),
			extensionTestsPath: path.resolve(__dirname, './suite/index'),
			launchArgs: [workspace, '--disable-extensions']
		});
	} catch (err) {
		console.error('Failed to run tests', err);
		process.exitCode = 1;
	} finally {
		fs.rmSync(workspace, { recursive: true, force: true });
	}
}

main();
