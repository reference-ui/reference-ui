/**
 * Build-time generator for the `@reference-ui/lib` BaseSystem dump.
 * Parses the six `tokens()` object literals, six `keyframes()` tables, and the
 * `font()` family table from `packages/reference-lib` without evaluating TypeScript,
 * merges them into a nested JSON artefact `from_json` accepts, and writes it next
 * to `lib_fixture`. `--check` regenerates in memory and exits 1 if the committed
 * file would change, including the keyframes object. Conditions, breakpoints, and
 * `globalCss` chrome stay out of this file. Recipes are not scraped from components.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { countLeaves, mergeKeyframeTables, mergeTokenTrees, type LeafShapes } from './merge';
import {
  fail,
  parseFontsObject,
  parseKeyframesArguments,
  parseTokensArguments,
  type JsonObject,
} from './parse';
import { dumpPath, FONT_FILE, KEYFRAME_FILES, libPath, TOKEN_FILES } from './sources';

const SYSTEM_NAME = '@reference-ui/lib';

type LibDump = {
  name: string;
  tokens: JsonObject;
  fonts: JsonObject;
  keyframes: JsonObject;
};

function buildDump(): LibDump {
  const args: JsonObject[] = [];
  for (const rel of TOKEN_FILES) {
    const found = parseTokensArguments(libPath(rel));
    if (found.length === 0) {
      fail(`no tokens() call in ${rel}`);
    }
    args.push(...found);
  }
  if (args.length !== TOKEN_FILES.length) {
    fail(`expected ${TOKEN_FILES.length} tokens() arguments, found ${args.length}`);
  }
  return {
    name: SYSTEM_NAME,
    tokens: mergeTokenTrees(args),
    fonts: parseFontsObject(libPath(FONT_FILE)),
    keyframes: loadKeyframeTables(),
  };
}

function loadKeyframeTables(): JsonObject {
  const tables: JsonObject[] = [];
  for (const rel of KEYFRAME_FILES) {
    const found = parseKeyframesArguments(libPath(rel));
    if (found.length === 0) {
      fail(`no keyframes() call in ${rel}`);
    }
    tables.push(...found);
  }
  if (tables.length !== KEYFRAME_FILES.length) {
    fail(`expected ${KEYFRAME_FILES.length} keyframes() arguments, found ${tables.length}`);
  }
  return mergeKeyframeTables(tables);
}

function formatDump(dump: LibDump): string {
  return `${JSON.stringify(dump, null, 2)}\n`;
}

function firstDiff(committed: string, generated: string): string {
  const left = committed.split('\n');
  const right = generated.split('\n');
  const n = Math.max(left.length, right.length);
  for (let i = 0; i < n; i++) {
    if (left[i] !== right[i]) {
      return [
        'base-system dump is stale (run: pnpm --filter @reference-ui/rust base-system)',
        `first difference at line ${i + 1}:`,
        `  committed: ${left[i] ?? '<eof>'}`,
        `  generated: ${right[i] ?? '<eof>'}`,
      ].join('\n');
    }
  }
  return 'base-system dump is stale';
}

function hasReferenceColors(tokens: JsonObject): boolean {
  const colors = tokens.colors;
  return typeof colors === 'object' && 'reference' in colors;
}

function logStats(dump: LibDump, shapes: LeafShapes): void {
  const families = Object.keys(dump.fonts).length;
  const keyframes = Object.keys(dump.keyframes).length;
  const reference = hasReferenceColors(dump.tokens);
  console.log(
    `[base-system] ${shapes.total} token leaves` +
      ` (value=${shapes.value} light+dark=${shapes.lightDark} value+dark=${shapes.valueDark}` +
      ` value+light=${shapes.valueLight} all-three=${shapes.allThree})` +
      ` + ${families} font families` +
      ` + ${keyframes} keyframes` +
      ` reference=${reference ? 'yes' : 'no'}`,
  );
}

function run(argv: string[]): void {
  const check = argv.includes('--check');
  const dump = buildDump();
  const generated = formatDump(dump);
  logStats(dump, countLeaves(dump.tokens));
  if (check) {
    if (!fs.existsSync(dumpPath)) {
      fail(`committed dump missing at ${dumpPath}; run pnpm --filter @reference-ui/rust base-system`);
    }
    const committed = fs.readFileSync(dumpPath, 'utf8');
    if (committed !== generated) {
      fail(firstDiff(committed, generated));
    }
    console.log('[base-system] dump is current');
    return;
  }
  fs.mkdirSync(path.dirname(dumpPath), { recursive: true });
  fs.writeFileSync(dumpPath, generated);
  console.log(`[base-system] wrote ${dumpPath}`);
}

try {
  run(process.argv.slice(2));
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
