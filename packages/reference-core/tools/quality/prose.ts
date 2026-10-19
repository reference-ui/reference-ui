/**
 * The one thin extra check for what no linter will ever judge: file headers and READMEs.
 * It takes file text and returns violations, keeping every threshold as a named constant.
 * run.ts discovers the files; this module only reads words and never parses code.
 */
export const HEADER_MIN_SENTENCES = 2;
export const HEADER_MAX_SENTENCES = 6;
// A README fails when two or more markdown table rows mention dotted filenames. Fenced code
// blocks are skipped so examples never trip the check; the heuristic is deliberately simple.
export const README_TABLE_HITS = 2;

const TABLE_ROW = /^\s*\|.*\|\s*$/;
const FENCE = /^\s*```/;
const FILE_LIKE = /[\w@~-][\w@~./-]*\.(m?[tj]sx?|jsx|cjs|mts|cts|json|md|css|html)\b/;

export interface Violation {
  file: string;
  line: number;
  ruleId: string;
  severity: 2 | 1;
  message: string;
}

// The first non-blank line, skipping a shebang on line one. May equal lines.length when none is left.
function firstContentIndex(lines: string[]): number {
  let i = lines[0]?.startsWith('#!') ? 1 : 0;
  while (i < lines.length && lines[i].trim() === '') i += 1;
  return i;
}

// A /* block from start through the line that closes it; null when the block never closes.
function blockCommentAt(lines: string[], start: number): string[] | null {
  const buf: string[] = [];
  for (let i = start; i < lines.length; i += 1) {
    buf.push(lines[i]);
    if (lines[i].includes('*/')) return buf;
  }
  return null;
}

// The run of consecutive // lines from start.
function lineCommentsAt(lines: string[], start: number): string[] {
  const buf: string[] = [];
  let i = start;
  while (i < lines.length && lines[i].trim().startsWith('//')) {
    buf.push(lines[i]);
    i += 1;
  }
  return buf;
}

function leadingCommentLines(text: string): string[] | null {
  const lines = text.split('\n');
  const start = firstContentIndex(lines);
  if (start >= lines.length) return null;
  if (lines[start].trim().startsWith('/*')) return blockCommentAt(lines, start);
  if (!lines[start].trim().startsWith('//')) return null;
  return lineCommentsAt(lines, start);
}

function countSentences(buf: string[]): number {
  const block = buf[0].trim().startsWith('/*');
  const words = buf
    .map((line) => {
      const s = line.trim();
      if (!block) return s.replace(/^\/\/ ?/, '');
      return s
        .replace(/^\/\*+/, '')
        .replace(/\*+\/$/, '')
        .replace(/^\* ?/, '');
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!words) return 0;
  return words
    .split(/[.!?]+(?=\s|$)/)
    .map((s) => s.trim())
    .filter(Boolean).length;
}

export function checkHeader(file: string, text: string | null | undefined): Violation | null {
  const fail = (message: string): Violation => ({ file, line: 1, ruleId: 'core/header', severity: 2, message });
  const buf = leadingCommentLines(text ?? '');
  if (!buf) return fail('core/header: missing file header; open with a 2-6 sentence comment saying what the file is, takes, and emits.');
  const n = countSentences(buf);
  if (n < HEADER_MIN_SENTENCES) {
    return fail(`core/header: one-liner header (${n} sentence); write ${HEADER_MIN_SENTENCES}-${HEADER_MAX_SENTENCES} complete sentences instead.`);
  }
  if (n > HEADER_MAX_SENTENCES) {
    return fail(`core/header: essay header (${n} sentences); trim it to ${HEADER_MIN_SENTENCES}-${HEADER_MAX_SENTENCES} sentences.`);
  }
  return null;
}

export function checkReadme(file: string, text: string | null | undefined): Violation | null {
  const lines = (text ?? '').split('\n');
  const hits: number[] = [];
  let fenced = false;
  lines.forEach((line, idx) => {
    if (FENCE.test(line)) fenced = !fenced;
    else if (!fenced && TABLE_ROW.test(line) && FILE_LIKE.test(line)) hits.push(idx + 1);
  });
  if (hits.length < README_TABLE_HITS) return null;
  return {
    file,
    line: hits[0],
    ruleId: 'core/readme',
    severity: 2,
    message: `core/readme: filename-table README (table rows at lines ${hits.join(', ')} list files); describe the architecture in prose instead.`,
  };
}
