// type.spec.ts — spec for NEO-TYPE-09, the strict-colours case. Takes { case }
// from the runner with the world freshly synced under strict: ['colors']. Emits
// nothing on success; throws naming the missing generated declaration, the
// absent StrictColorProps wrapper, the tsc diagnostic that broke the positive
// consumer, or the off-token negative that typechecked.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';

interface SpecInput {
  case: NeoCase;
}

const MAX_LINES = 40;

// Every positive line is a colour the strict surface must accept: a token, a
// toned token, the CSS keywords, and each call site (JSX prop, css() and the
// css prop). The width line is a non-colour prop with a free value: only
// colours narrow, so it must still typecheck.
const POSITIVE = `import { css, Div } from '@reference-ui/react'

export const token = <Div bg="blue.500" />
export const toned = <Div bg="blue.500/medium" />
export const pair = <Div bg="blue.500" color="blue.500/medium" />
export const keywords = <Div bg="transparent" color="inherit" borderColor="currentColor" />
export const white = <Div bg="white" />
export const cls = css({ bg: 'blue.500/medium' })
export const bordered = <Div css={{ borderColor: 'blue.500/medium' }} />
export const responsive = <Div r={{ '@md': { bg: 'blue.500' } }} />
export const width = <Div width="37px" />
`;

// Each negative is one off-token colour at one call site, and `offending` is
// the literal the diagnostic must name. The import line is shared; every
// negative is materialized and typechecked on its own, so each failure is
// attributable to the single line that carries it.
const HEADER = `import { css, Div } from '@reference-ui/react'\n\n`;

const NEGATIVES: ReadonlyArray<{ label: string; body: string; offending: string }> = [
  { label: 'JSX bg with a raw /50 opacity suffix', body: `export const bad = <Div bg="blue.500/50" />\n`, offending: 'blue.500/50' },
  { label: 'JSX bg with a string that names no token', body: `export const bad = <Div bg="not-a-token" />\n`, offending: 'not-a-token' },
  { label: 'JSX bg with a raw hex colour', body: `export const bad = <Div bg="#fff" />\n`, offending: '#fff' },
  { label: 'css() bg with a raw /50 opacity suffix', body: `export const bad = css({ bg: 'blue.500/50' })\n`, offending: 'blue.500/50' },
  { label: 'css prop bg with a raw /50 opacity suffix', body: `export const bad = <Div css={{ bg: 'blue.500/50' }} />\n`, offending: 'blue.500/50' },
  { label: 'responsive r map with a raw hex colour', body: `export const bad = <Div r={{ '@md': { bg: '#fff' } }} />\n`, offending: '#fff' },
];

// A rejected colour is TS2322 at a JSX attribute, TS2345 at a css() argument
// (the call position reports an argument mismatch), and TS2820 for a near miss.
const REJECTION = /negative\.tsx\(\d+,\d+\): error TS(2322|2345|2820)/;

interface WorldTsconfig {
  compilerOptions?: Record<string, unknown>;
}

function readWorldTsconfig(worldDir: string): Record<string, string[]> {
  const raw = fs.readFileSync(path.join(worldDir, 'tsconfig.json'), 'utf8');
  const parsed = JSON.parse(raw) as WorldTsconfig;
  const compilerOptions = parsed.compilerOptions ?? {};
  const paths = compilerOptions['paths'] as Record<string, string[]> | undefined;
  assert.ok(paths && typeof paths === 'object', 'world tsconfig.json carries a paths map');
  const react = paths['@reference-ui/react'];
  assert.ok(
    Array.isArray(react) && react.some((p) => p.endsWith('react/react.d.mts')),
    `world tsconfig maps @reference-ui/react at the generated react.d.mts, got ${JSON.stringify(react)}`,
  );
  const styled = paths['@reference-ui/styled'];
  assert.ok(
    Array.isArray(styled) && styled.some((p) => p.endsWith('styled/types/index.d.ts')),
    `world tsconfig maps @reference-ui/styled at the generated styled types, got ${JSON.stringify(styled)}`,
  );
  return paths;
}

function resolvePackageFile(specifier: string, file: string): string {
  const pkgFile = createRequire(import.meta.url).resolve(`${specifier}/package.json`);
  return path.join(path.dirname(pkgFile), file);
}

function tscBin(): string {
  // Resolve through package.json, not the bin subpath: the exports map
  // does not expose bin/tsc directly (same approach as the shared gate).
  return resolvePackageFile('typescript', path.join('bin', 'tsc'));
}

// The react-jsx runtime is resolved from the consumer's own location, and the
// temp dir sits outside the checkout with no node_modules, so the JSX runtime
// is mapped to the package's own @types/react. Nothing else is remapped.
function reactTypesPaths(): Record<string, string[]> {
  const typesDir = path.dirname(createRequire(import.meta.url).resolve('@types/react/package.json'));
  return {
    react: [path.join(typesDir, 'index.d.ts')],
    'react/jsx-runtime': [path.join(typesDir, 'jsx-runtime.d.ts')],
  };
}

function runTsc(cwd: string): Promise<{ code: number | null; text: string }> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [tscBin(), '--noEmit', '-p', cwd],
      { timeout: 180000 },
      (err, stdout, stderr) => {
        if (err && (err.killed || (err as { code?: unknown }).code === 'ETIMEDOUT')) {
          resolve({ code: null, text: 'tsc timed out after 180s' });
          return;
        }
        resolve({ code: err ? ((err as { code?: number }).code ?? 1) : 0, text: `${stdout}\n${stderr}` });
      },
    );
  });
}

function capped(text: string): string[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) lines.push('tsc failed with no diagnostics');
  const shown = lines.slice(0, MAX_LINES);
  if (lines.length > MAX_LINES) shown.push(`... and ${lines.length - MAX_LINES} more diagnostics`);
  return shown;
}

// The committed world/tsconfig.json is the single source of truth for the
// mapping; the temp project reuses its paths rewritten absolute (a temp dir
// outside the checkout cannot resolve them relatively). Nothing is written
// into the repo, so a later pre-run typecheck never sees the consumers.
async function typecheckFile(
  worldDir: string,
  paths: Record<string, string[]>,
  file: string,
  source: string,
): Promise<{ code: number | null; text: string }> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-type-09-'));
  try {
    const absolute: Record<string, string[]> = {};
    for (const [specifier, targets] of Object.entries({ ...paths, ...reactTypesPaths() })) {
      absolute[specifier] = targets.map((target) =>
        path.isAbsolute(target) ? target : path.join(worldDir, target),
      );
    }
    fs.writeFileSync(path.join(dir, file), source);
    fs.writeFileSync(
      path.join(dir, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            strict: true,
            noEmit: true,
            jsx: 'react-jsx',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            target: 'ES2022',
            lib: ['ES2022', 'DOM'],
            skipLibCheck: false,
            paths: absolute,
          },
          include: [`./${file}`],
        },
        null,
        2,
      ),
    );
    return await runTsc(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// After sync under strict colours, the generated declarations wrap the style
// props in StrictColorProps, every token, toned and keyword colour assigns at
// each call site with the non-colour prop free, and each off-token colour is
// rejected at its own consumer line, naming that colour in the diagnostic.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const paths = readWorldTsconfig(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  for (const file of ['react/react.d.mts', 'styled/types/index.d.ts']) {
    assert.ok(fs.existsSync(path.join(outDir, file)), `sync published ${file}`);
  }

  const styledTypes = fs.readFileSync(path.join(outDir, 'styled/types/index.d.ts'), 'utf8');
  assert.ok(
    styledTypes.includes('StrictColorProps<BaseStyleProps>'),
    'strict colours wrap the style props: styled types carry StrictColorProps<BaseStyleProps>',
  );

  const positive = await typecheckFile(c.worldDir, paths, 'positive.tsx', POSITIVE);
  assert.equal(
    positive.code,
    0,
    `token, toned, keyword and css() colours assign under strict:\n${capped(positive.text).join('\n')}`,
  );

  for (const negative of NEGATIVES) {
    const result = await typecheckFile(c.worldDir, paths, 'negative.tsx', HEADER + negative.body);
    assert.notEqual(result.code, 0, `${negative.label} is rejected under strict`);
    assert.match(
      result.text,
      REJECTION,
      `${negative.label} is a type error at the consumer line:\n${capped(result.text).join('\n')}`,
    );
    assert.ok(
      result.text.includes(`Type '"${negative.offending}"' is not assignable`),
      `${negative.label} names its offending value "${negative.offending}":\n${capped(result.text).join('\n')}`,
    );
  }
}
