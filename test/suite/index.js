const path = require('path');
const Mocha = require('mocha');
const { glob } = require('glob');

function run() {
	const mocha = new Mocha({
		ui: 'tdd',
		color: true,
		timeout: 20000
	});

	const testsRoot = __dirname;

	return new Promise((c, e) => {
		glob('**/*.test.js', { cwd: testsRoot }).then(files => {
			files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));
			try {
				mocha.run(failures => {
					if (failures > 0) {
						e(new Error(`${failures} tests failed.`));
					} else {
						c();
					}
				});
			} catch (err) {
				console.error(err);
				e(err);
			}
		}).catch(err => {
			return e(err);
		});
	});
}

module.exports = { run };
