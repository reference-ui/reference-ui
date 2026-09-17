// types.spec.ts — spec for NEO-PARITY-01, the P7/P16 tsc harness. Takes
// { case } from the runner with the world freshly synced. Emits nothing on
// success; throws naming the tsc diagnostic that broke the augmented
// consumer on failure. Neo declares no PrimitiveVariantRegistry of its own
// (variant?: unknown), so P7 proves the matrix augment-and-use consumer file
// shape typechecks green against the generated entry; P16 rides the same
// consumer with spacing-union negatives.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const MAX_LINES = 40;

// P7: the matrix augmentation file shape (declare module plus the augmented
// literal), extended with P16 spacing-union negatives in CssStyles and JSX
// props. Materialized into a temp dir at spec time: it must resolve the
// generated entry, which exists only after this world's sync.
const CONSUMER = `import { Button, Div, css, type CssStyles } from '@reference-ui/react'

declare module '@reference-ui/react' {
  interface PrimitiveVariantRegistry {
    button: 'default' | 'primary' | 'ghost' | 'glow'
  }
}

export const glow = <Button variant="glow">glow</Button>

const negatives: CssStyles = { marginTop: '-sm', marginLeft: '-1r', padding: '-4r' }
export const negativeClass: string = css(negatives)

export const negativeDiv = (
  <Div mt="-sm" p="-1r">
    neg
  </Div>
)
`;

function readWorldPaths(worldDir: string): Record<string, string[]> {
  const raw = fs.readFileSync(path.join(worldDir, 'tsconfig.json'), 'utf8');
  const parsed = JSON.parse(raw) as { compilerOptions?: Record<string, unknown> };
  const paths = parsed.compilerOptions?.['paths'] as Record<string, string[]> | undefined;
  assert.ok(paths && typeof paths === 'object', 'world tsconfig.json carries a paths map');
  const react = paths['@reference-ui/react'];
  assert.ok(
    Array.isArray(react) && react.some((p) => p.endsWith('react/react.d.mts')),
    'world tsconfig maps @reference-ui/react at the generated react.d.mts',
  );
  return paths;
}

function tscBin(): string {
  const pkgFile = createRequire(import.meta.url).resolve('typescript/package.json');
  return path.join(path.dirname(pkgFile), 'bin', 'tsc');
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

async function typecheckConsumer(worldDir: string, paths: Record<string, string[]>): Promise<void> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-parity-01-'));
  try {
    const absolute: Record<string, string[]> = {};
    for (const [specifier, targets] of Object.entries(paths)) {
      absolute[specifier] = targets.map((target) =>
        path.isAbsolute(target) ? target : path.join(worldDir, target),
      );
    }
    const typesReact = path.dirname(createRequire(import.meta.url).resolve('@types/react/package.json'));
    const typesReactDom = path.dirname(createRequire(import.meta.url).resolve('@types/react-dom/package.json'));
    absolute['react'] = [path.join(typesReact, 'index.d.ts')];
    absolute['react/jsx-runtime'] = [path.join(typesReact, 'jsx-runtime.d.ts')];
    absolute['react-dom/client'] = [path.join(typesReactDom, 'client.d.ts')];
    fs.writeFileSync(path.join(dir, 'consumer.tsx'), CONSUMER);
    fs.writeFileSync(
      path.join(dir, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            strict: true,
            noEmit: true,
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            jsx: 'react-jsx',
            target: 'ES2022',
            lib: ['ES2022', 'DOM'],
            skipLibCheck: false,
            paths: absolute,
          },
          include: ['./consumer.tsx'],
        },
        null,
        2,
      ),
    );
    const run = await runTsc(dir);
    const lines = run.text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    assert.equal(run.code, 0, `augmented consumer typechecks green:\n${lines.slice(0, MAX_LINES).join('\n')}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  for (const file of ['react/react.d.mts', 'styled/types/index.d.ts']) {
    assert.ok(fs.existsSync(path.join(outDir, file)), `sync published ${file}`);
  }
  await typecheckConsumer(c.worldDir, readWorldPaths(c.worldDir));
}
