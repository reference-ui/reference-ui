// type.spec.ts — spec for NEO-TYPE-01, the generated-declarations case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the missing
// generated declaration, the tsc diagnostic that broke the consumer, or the
// unpainted probe on failure.
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

// End-state consumer: primitives, css()/recipe(), and the named type graph,
// all imported from the generated react entry. It is materialized into a temp
// dir at spec time because it cannot live in the repo: the harness pre-run
// typecheck resolves @reference-ui/react to the stable surface, which does not
// export css/recipe until the follow-up lands the generated graph in lockstep.
const CONSUMER = `import {
  Button,
  Div,
  css,
  recipe,
  type ButtonProps,
  type CssStyles,
  type DivProps,
  type FontProps,
  type PrimitiveProps,
  type RecipeVariantProps,
  type StyleProps,
  type SystemStyleObject,
} from '@reference-ui/react'

const styles: SystemStyleObject = { color: 'brand', p: 'sm' }
const extra: CssStyles = { color: 'ink' }
const skipped: CssStyles = false
const panelClass: string = css(styles, extra, skipped)

const button = recipe({
  className: 'button',
  base: { display: 'inline-flex' },
  variants: {
    tone: { accent: { color: 'brand' }, muted: { color: 'paper' } },
    size: { sm: { p: 'sm' }, lg: { p: 'lg' } },
  },
  defaultVariants: { tone: 'muted', size: 'sm' },
})

type ButtonSelection = RecipeVariantProps<typeof button>
const selection: ButtonSelection = { tone: 'accent', size: 'lg' }
const buttonClass: string = button(selection)

const copy: StyleProps = { color: 'ink' }
const primitive: PrimitiveProps<'div'> = { color: 'brand', p: 'sm' }
const fonts: FontProps = { font: 'sans', weight: 'bold' }

export function Card(props: DivProps): unknown {
  return (
    <Div color="brand" p="sm" {...props}>
      <Button className={buttonClass} id="proof-recipe">
        recipe
      </Button>
      <span className={panelClass} id="proof-css">
        css
      </span>
    </Div>
  )
}

export type { ButtonProps }
export const probe = { copy, primitive, fonts }
`;

interface WorldTsconfig {
  compilerOptions?: Record<string, unknown>;
}

function readWorldTsconfig(worldDir: string): { paths: Record<string, string[]>; compilerOptions: Record<string, unknown> } {
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
  return { paths, compilerOptions };
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
// outside the checkout cannot resolve them relatively) plus react shims the
// generated declarations import. Nothing is written into the repo, so a later
// pre-run typecheck never sees the end-state consumer.
async function typecheckConsumer(worldDir: string, paths: Record<string, string[]>): Promise<void> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-type-01-'));
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
    assert.equal(
      run.code,
      0,
      `generated declarations compile the consumer world:\n${capped(run.text).join('\n')}`,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// After sync, the generated react entry plus the styled typegen output compile
// a consumer using primitives, css()/recipe(), and named types — and the same
// world paints its token-driven probes in the browser.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const { paths } = readWorldTsconfig(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  for (const file of ['react/react.d.mts', 'styled/types/index.d.ts']) {
    assert.ok(fs.existsSync(path.join(outDir, file)), `sync published ${file}`);
  }
  await typecheckConsumer(c.worldDir, paths);

  const root = page.locator('#type-root');
  await root.waitFor();
  assert.equal(
    await root.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'root paints brand text',
  );
  const copy = page.locator('#type-copy');
  await copy.waitFor();
  assert.equal(
    await copy.evaluate((el) => getComputedStyle(el).color),
    'rgb(17, 17, 17)',
    'style-props spread paints ink text',
  );
  const baked = page.locator('#type-recipe');
  await baked.waitFor();
  assert.equal(
    await baked.evaluate((el) => getComputedStyle(el).color),
    'rgb(124, 58, 237)',
    'recipe accent paints brand text',
  );
  const panel = page.locator('#type-css');
  await panel.waitFor();
  assert.equal(
    await panel.evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgb(255, 255, 255)',
    'css panel paints paper background',
  );
}
