// Unit tests for the pure EARS logic in src/ears.js — run with `npm run test:unit`,
// no VS Code instance required.

const assert = require('assert');
const { splitLine, classify, parseSpec, organize } = require('../../src/ears');

suite('classify', () => {
	const cases = [
		['The <system> shall <response>.', 'ubiquitous'],
		['While <state>, the <system> shall <response>.', 'state'],
		['When <trigger>, the <system> shall <response>.', 'event'],
		['Where <feature>, the <system> shall <response>.', 'option'],
		['If <problem>, then the <system> shall <response>.', 'unwanted'],
		['If <problem>, the <system> shall <response>.', 'unwanted'],
		['If you need help, ask the team.', 'unclassified'],
		['Users shall be able to log out.', 'ubiquitous'],
		['> Tip: read the docs.', 'unclassified'],
		['- [DRAFT] When <x>, the system shall <y>.', 'event'],
		['* [STABLE] #Unwanted If <x>, then the system shall <y>.', 'unwanted'],
		['1. While <x>, the system shall <y>.', 'state'],
		['#Option-Driven [DRAFT] Where <x>, the system shall <y>.', 'option']
	];
	for (const [line, expected] of cases) {
		test(`${JSON.stringify(line)} -> ${expected}`, () => {
			assert.strictEqual(classify(line), expected);
		});
	}

	test('headings and blank lines are structure, not requirements', () => {
		assert.strictEqual(classify('## Ubiquitous'), null);
		assert.strictEqual(classify('# The system shall be great'), null);
		assert.strictEqual(classify('   '), null);
		assert.strictEqual(classify('[DRAFT]'), null);
	});
});

suite('splitLine', () => {
	test('extracts status and tag in either order', () => {
		assert.deepStrictEqual(splitLine('- [draft] #Event-Driven When x, the system shall y.'), {
			status: 'DRAFT', tag: 'Event-Driven', text: 'When x, the system shall y.'
		});
		assert.deepStrictEqual(splitLine('#Ubiquitous [STABLE] The system shall y.'), {
			status: 'STABLE', tag: 'Ubiquitous', text: 'The system shall y.'
		});
	});

	test('only a leading marker counts as status', () => {
		assert.strictEqual(splitLine('> Status legend: [DRAFT] = under discussion').status, null);
	});
});

suite('parseSpec', () => {
	test('intro notes before the first requirement are not requirements', () => {
		const lines = ['# Title', '', '> A note', 'Some intro prose.', '', '[DRAFT] The system shall work.'];
		const { bodyStart, requirements } = parseSpec(lines);
		assert.strictEqual(bodyStart, 5);
		assert.deepStrictEqual(requirements, [{
			line: 5, text: '[DRAFT] The system shall work.', label: 'The system shall work.',
			type: 'ubiquitous', status: 'DRAFT'
		}]);
	});

	test('the body starts at the first sub-heading', () => {
		const { bodyStart, requirements } = parseSpec(['# T', '## Notes', 'free text']);
		assert.strictEqual(bodyStart, 1);
		assert.strictEqual(requirements[0].type, 'unclassified');
	});
});

suite('organize', () => {
	const template = [
		'# Auth Requirements',
		'',
		'> Status legend: [DRAFT] = under discussion · [STABLE] = agreed',
		'> Tip: run Organize when done.',
		'',
		'[DRAFT] If <x>, then the system shall <y>.',
		'[DRAFT] The system shall <a>.',
		'When <t>, the system shall <r>.',
		'[STABLE] When <u>, the system shall <v>.',
		'[DRAFT] When <w>, the system shall <z>.',
		'## Stray heading',
		'A trailing note.',
		''
	].join('\n');

	const expected = [
		'# Auth Requirements',
		'',
		'> Status legend: [DRAFT] = under discussion · [STABLE] = agreed',
		'> Tip: run Organize when done.',
		'',
		'## Ubiquitous',
		'',
		'[DRAFT] The system shall <a>.',
		'',
		'## Event-Driven',
		'',
		'[STABLE] When <u>, the system shall <v>.',
		'[DRAFT] When <w>, the system shall <z>.',
		'When <t>, the system shall <r>.',
		'',
		'## Unwanted',
		'',
		'[DRAFT] If <x>, then the system shall <y>.',
		'',
		'## Unclassified',
		'',
		'A trailing note.',
		''
	].join('\n');

	test('groups by archetype, sorts by status and keeps the intro block', () => {
		const result = organize(template);
		assert.strictEqual(result.text, expected);
		assert.strictEqual(result.requirements, 6); // includes the unclassified note
		assert.strictEqual(result.sections, 4);
	});

	test('is idempotent', () => {
		assert.strictEqual(organize(expected).text, expected);
	});

	test('preserves CRLF line endings', () => {
		const out = organize(template.replace(/\n/g, '\r\n')).text;
		assert.strictEqual(out, expected.replace(/\n/g, '\r\n'));
	});

	test('adds a default title when the spec has none', () => {
		assert.strictEqual(
			organize('The system shall work.').text,
			'# Requirements\n\n## Ubiquitous\n\nThe system shall work.\n'
		);
	});

	test('lifts a title found after the first requirement', () => {
		assert.strictEqual(
			organize('The system shall work.\n# Late Title\n').text,
			'# Late Title\n\n## Ubiquitous\n\nThe system shall work.\n'
		);
	});
});
