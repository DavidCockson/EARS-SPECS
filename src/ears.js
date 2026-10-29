// Pure EARS logic: line classification, spec parsing and the Organize rewrite.
// Deliberately free of the `vscode` API so it can be unit-tested with plain mocha.

// The 5 EARS archetypes, in canonical order, plus a catch-all bucket.
const TYPES = [
  { key: 'ubiquitous', label: 'Ubiquitous' },
  { key: 'state', label: 'State-Driven' },
  { key: 'event', label: 'Event-Driven' },
  { key: 'option', label: 'Option-Driven' },
  { key: 'unwanted', label: 'Unwanted' },
  { key: 'unclassified', label: 'Unclassified' }
];

const SPEC_SUFFIX = '.ears.md';
const DEFAULT_TITLE = '# Requirements';

const HEADING_RE = /^\s*#{1,6}\s/;
const H1_RE = /^\s*#\s+\S/;
const LIST_MARKER_RE = /^(?:[-*+]|\d+[.)])\s+/;
const STATUS_RE = /^\[(DRAFT|STABLE)\]\s*/i;
const TAG_RE = /^#([\w-]+)\s*/; // "#Event-Driven" — no space after '#', so never a heading

// STABLE first, then DRAFT, then untagged — keeps agreed work at the top.
const STATUS_RANK = { STABLE: 0, DRAFT: 1 };
const statusRank = (status) => (status in STATUS_RANK ? STATUS_RANK[status] : 2);

const isSpecFileName = (name) => typeof name === 'string' && name.endsWith(SPEC_SUFFIX);

// Peel the optional list marker, [DRAFT]/[STABLE] status and #Archetype tag off the
// front of a line. Status and tag may appear in either order.
function splitLine(rawLine) {
  let text = rawLine.trim().replace(LIST_MARKER_RE, '');
  let status = null;
  let tag = null;
  for (;;) {
    const s = status === null && text.match(STATUS_RE);
    if (s) { status = s[1].toUpperCase(); text = text.slice(s[0].length); continue; }
    const t = tag === null && text.match(TAG_RE);
    if (t) { tag = t[1]; text = text.slice(t[0].length); continue; }
    break;
  }
  return { status, tag, text: text.trim() };
}

// The EARS type is fully determined by the opening keyword, so no manual tags are
// required. Returns null for structure (headings, blank lines).
function classify(rawLine) {
  if (HEADING_RE.test(rawLine)) return null;
  const { text } = splitLine(rawLine);
  if (!text) return null;

  if (/^if\b/i.test(text) && /\b(then|shall)\b/i.test(text)) return 'unwanted';
  if (/^when\b/i.test(text)) return 'event';
  if (/^while\b/i.test(text)) return 'state';
  if (/^where\b/i.test(text)) return 'option';
  if (/\bshall\b/i.test(text)) return 'ubiquitous';
  return 'unclassified';
}

// A spec is a free-form "head" (title, front matter, intro notes) followed by a
// body of requirements. The body starts at the first sub-heading or the first line
// that classifies as an EARS pattern; everything before it is kept verbatim.
function findBodyStart(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (HEADING_RE.test(lines[i]) && !H1_RE.test(lines[i])) return i;
    const type = classify(lines[i]);
    if (type && type !== 'unclassified') return i;
  }
  return lines.length;
}

// Parse spec lines into { bodyStart, requirements } where each requirement is
// { line, text, label, type, status }. `text` is the trimmed source line; `label`
// is the sentence alone, without list marker, status or tag.
function parseSpec(lines) {
  const bodyStart = findBodyStart(lines);
  const requirements = [];
  for (let i = bodyStart; i < lines.length; i++) {
    const type = classify(lines[i]);
    if (!type) continue;
    const { status, text: label } = splitLine(lines[i]);
    requirements.push({ line: i, text: lines[i].trim(), label, type, status });
  }
  return { bodyStart, requirements };
}

// Rewrite a spec into one section per archetype. Returns the new text plus counts
// for user feedback. Idempotent: organising an organised spec changes nothing.
function organize(text) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const { bodyStart, requirements } = parseSpec(lines);

  const head = lines.slice(0, bodyStart);
  while (head.length && !head[head.length - 1].trim()) head.pop();
  if (!head.some((l) => H1_RE.test(l))) {
    const bodyTitle = lines.slice(bodyStart).find((l) => H1_RE.test(l));
    head.unshift((bodyTitle || DEFAULT_TITLE).trim());
  }

  const out = [...head, ''];
  let sections = 0;
  for (const ty of TYPES) {
    const items = requirements
      .filter((r) => r.type === ty.key)
      .sort((a, b) => statusRank(a.status) - statusRank(b.status));
    if (!items.length) continue;
    sections++;
    out.push(`## ${ty.label}`, '', ...items.map((r) => r.text), '');
  }

  while (out.length && !out[out.length - 1].trim()) out.pop();
  return { text: out.join(eol) + eol, requirements: requirements.length, sections };
}

// Validation for the New Spec file-name prompt. Returns an error message or null.
function validateSpecName(name) {
  const trimmed = (name || '').trim();
  if (!isSpecFileName(trimmed) || trimmed === SPEC_SUFFIX) return `Name must end with ${SPEC_SUFFIX}`;
  if (/[\\/]/.test(trimmed)) return 'Enter a file name, not a path';
  return null;
}

module.exports = {
  TYPES, SPEC_SUFFIX, isSpecFileName, splitLine, classify, parseSpec, organize, validateSpecName
};
