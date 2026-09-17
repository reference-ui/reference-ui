/**
 * The one thin extra check for what ESLint will never judge: file headers and READMEs.
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

function leadingCommentLines(text: string): string[] | null {
  const lines = text.split('\n');
  let i = lines[0]?.startsWith('#!') ? 1 : 0;
  while (i < lines.length && lines[i].trim() === '') i += 1;
  if (i >= lines.length) return null;
  if (lines[i].trim().startsWith('/*')) {
    const buf: string[] = [];
    while (i < lines.length) {
      buf.push(lines[i]);
      if (lines[i].includes('*/')) return buf;
      i += 1;
    }
    return null;
  }
  if (!lines[i].trim().startsWith('//')) return null;
  const buf: string[] = [];
  while (i < lines.length && lines[i].trim().startsWith('//')) {
    buf.push(lines[i]);
    i += 1;
  }
  return buf;
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
  const fail = (message: string): Violation => ({ file, line: 1, ruleId: 'neo/header', severity: 2, message });
  const buf = leadingCommentLines(text ?? '');
  if (!buf) return fail('neo/header: missing file header; open with a 2-6 sentence comment saying what the file is, takes, and emits.');
  const n = countSentences(buf);
  if (n < HEADER_MIN_SENTENCES) {
    return fail(`neo/header: one-liner header (${n} sentence); write ${HEADER_MIN_SENTENCES}-${HEADER_MAX_SENTENCES} complete sentences instead.`);
  }
  if (n > HEADER_MAX_SENTENCES) {
    return fail(`neo/header: essay header (${n} sentences); trim it to ${HEADER_MIN_SENTENCES}-${HEADER_MAX_SENTENCES} sentences.`);
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
    ruleId: 'neo/readme',
    severity: 2,
    message: `neo/readme: filename-table README (table rows at lines ${hits.join(', ')} list files); describe the architecture in prose instead.`,
  };
}
