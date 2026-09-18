// surface.spec.ts — spec for NEO-PRIM-10, the generated-entry surface case. Takes
// { case } from the runner with the world freshly synced and asserts node-side:
// the react bundle exports every tag plus css/recipe, the declarations carry
// every consumer type name, and a temp consumer importing the whole surface
// typechecks. Emits nothing on success; throws naming the missing export,
// the absent type name, or the tsc diagnostic on failure.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

// The 101 JSX names, pinned against the core tag set through toJsxName
// ([core] system/primitives/tags.ts): the runtime bundle must export each
// as a component, and the declarations must type each as *Props plus const.
const EXPECTED_JSX_NAMES = [
  'A',
  'Abbr',
  'Address',
  'Area',
  'Article',
  'Aside',
  'Audio',
  'B',
  'Bdi',
  'Bdo',
  'Blockquote',
  'Br',
  'Button',
  'Canvas',
  'Caption',
  'Cite',
  'Code',
  'Col',
  'Colgroup',
  'Data',
  'Datalist',
  'Dd',
  'Del',
  'Details',
  'Dfn',
  'Dialog',
  'Div',
  'Dl',
  'Dt',
  'Em',
  'Embed',
  'Fieldset',
  'Figcaption',
  'Figure',
  'Footer',
  'Form',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'Header',
  'Hgroup',
  'Hr',
  'I',
  'Iframe',
  'Img',
  'Input',
  'Ins',
  'Kbd',
  'Label',
  'Legend',
  'Li',
  'Main',
  'Map',
  'Mark',
  'Menu',
  'Meter',
  'Nav',
  'Obj',
  'Ol',
  'Optgroup',
  'Option',
  'Output',
  'P',
  'Picture',
  'Pre',
  'Progress',
  'Q',
  'Rp',
  'Rt',
  'Ruby',
  'S',
  'Samp',
  'Search',
  'Section',
  'Select',
  'Small',
  'Source',
  'Span',
  'Strong',
  'Sub',
  'Summary',
  'Sup',
  'Svg',
  'Table',
  'Tbody',
  'Td',
  'Textarea',
  'Tfoot',
  'Th',
  'Thead',
  'Time',
  'Tr',
  'Track',
  'U',
  'Ul',
  'Var',
  'Video',
  'Wbr',
] as const;

// React-owned declaration lines: the generated entry declares each directly
// (generate.ts plus the publish tail), so the spec pins the exact prefixes.
const EXPECTED_REACT_DECLS = [
  'export type CssStyles = ',
  'export type PrimitiveProps<',
  'export type PrimitiveTag = ',
  'export type PrimitiveElement<',
  'export type RecipeVariantProps<',
  'export declare function css(',
  'export declare function recipe<',
] as const;

// Styled-owned names the react entry re-exports through its named graph
// (generated-folder-shape §7 item 4): the spec pins them in styled types
// and proves they import from react in the temp consumer below.
const EXPECTED_STYLED_NAMES = [
  'StyleProps',
  'SystemStyleObject',
  'FontRegistry',
  'FontName',
  'FontProps',
  'FontWeightName',
  'FontWeightValue',
  'ScopedFontWeight',
] as const;

// First census: the runtime bundle. Every tag is a forwarded component
// naming its own tag (forwardRef carries ref on React 17/18/19 alike),
// css()/recipe() are bound functions, and the pattern pack (Box/Flex/
// Grid) stays absent — the map rule at the entry point.
async function assertRuntimeSurface(outDir: string): Promise<void> {
  const entryPath = path.join(outDir, 'react', 'react.mjs');
  const entry = (await import(pathToFileURL(entryPath).href)) as unknown as Record<
    string,
    unknown
  >;
  for (const name of EXPECTED_JSX_NAMES) {
    const component = entry[name] as { $$typeof?: symbol; render?: unknown };
    assert.equal(
      component.$$typeof,
      Symbol.for('react.forward_ref'),
      `react entry exports the ${name} tag as a forwarded component`,
    );
    assert.equal(typeof component.render, 'function', `${name} renders through forwardRef`);
  }
  assert.equal(typeof entry.css, 'function', 'react entry exports css');
  assert.equal(typeof entry.recipe, 'function', 'react entry exports recipe');
  for (const absent of ['Box', 'Flex', 'Grid']) {
    assert.equal(entry[absent], undefined, `${absent} is a pattern, never a primitive`);
  }
  for (const name of EXPECTED_JSX_NAMES) {
    const component = entry[name] as { displayName?: unknown };
    assert.equal(component.displayName, name, `${name} names its own tag`);
  }
}

// Second census: the declarations. All 101 tags carry a props type plus a
// const, the react-owned names are declared directly, and the styled-owned
// names sit behind the entry's named-graph re-export.
function assertDeclarationSurface(outDir: string): void {
  const reactTypes = fs.readFileSync(path.join(outDir, 'react', 'react.d.mts'), 'utf8');
  const styledTypes = fs.readFileSync(
    path.join(outDir, 'styled', 'types', 'index.d.ts'),
    'utf8',
  );
  assert.equal(
    new Set(EXPECTED_JSX_NAMES).size,
    101,
    'the pinned name table carries 101 unique tags',
  );
  for (const name of EXPECTED_JSX_NAMES) {
    assert.ok(
      reactTypes.includes(`export type ${name}Props = `),
      `react declarations type ${name}Props`,
    );
    assert.ok(
      reactTypes.includes(`export declare const ${name}: `),
      `react declarations export ${name}`,
    );
  }
  for (const decl of EXPECTED_REACT_DECLS) {
    assert.ok(reactTypes.includes(decl), `react declarations carry ${decl}`);
  }
  assert.ok(
    reactTypes.includes(`export type * from '@reference-ui/styled'`),
    'react declarations re-export the styled named graph',
  );
  for (const name of EXPECTED_STYLED_NAMES) {
    assert.ok(styledTypes.includes(name), `styled types declare ${name}`);
  }
}

const MAX_LINES = 40;

// End-state surface consumer: every tag, css()/recipe(), and the full named
// type graph, all imported from the generated react entry. It is materialized
// into a temp dir at spec time because it cannot live in the repo: the harness
// pre-run typecheck resolves @reference-ui/react to the stable surface, while
// this consumer proves the generated declarations (TYPE-01 pattern).
function consumerSource(): string {
  const tags = EXPECTED_JSX_NAMES.join(', ');
  return [
    `import { ${tags}, css, recipe } from '@reference-ui/react'`,
    `import type {`,
    `  ButtonProps,`,
    `  CssStyles,`,
    `  DivProps,`,
    `  FontName,`,
    `  FontProps,`,
    `  FontRegistry,`,
    `  FontWeightName,`,
    `  FontWeightValue,`,
    `  PrimitiveElement,`,
    `  PrimitiveProps,`,
    `  PrimitiveTag,`,
    `  RecipeVariantProps,`,
    `  ScopedFontWeight,`,
    `  StyleProps,`,
    `  SystemStyleObject,`,
    `} from '@reference-ui/react'`,
    ``,
    `const components = [${tags}]`,
    `export const tagCount: number = components.length`,
    ``,
    `const styles: SystemStyleObject = { color: 'brand', p: 'sm' }`,
    `const extra: CssStyles = { color: 'ink' }`,
    `const skipped: CssStyles = false`,
    `const panelClass: string = css(styles, extra, skipped)`,
    ``,
    `const chip = recipe({`,
    `  className: 'chip',`,
    `  base: { display: 'inline-flex' },`,
    `  variants: {`,
    `    tone: { accent: { color: 'brand' }, muted: { color: 'paper' } },`,
    `  },`,
    `  defaultVariants: { tone: 'muted' },`,
    `})`,
    `type ChipSelection = RecipeVariantProps<typeof chip>`,
    `const selection: ChipSelection = { tone: 'accent' }`,
    `const chipClass: string = chip(selection)`,
    ``,
    `const copy: StyleProps = { color: 'ink' }`,
    `const primitive: PrimitiveProps<'div'> = { color: 'brand', p: 'sm' }`,
    `const fonts: FontProps = { font: 'sans', weight: 'bold' }`,
    `const tag: PrimitiveTag = 'div'`,
    `const host: PrimitiveElement<'div'> = null as unknown as HTMLDivElement`,
    `const captionHost: PrimitiveElement<'caption'> = null as unknown as HTMLTableCaptionElement`,
    `const fontNames: FontName[] = []`,
    `const registry: FontRegistry = {}`,
    `type WeightNameOf<T extends FontName> = FontWeightName<T>`,
    `type WeightValueOf<T extends FontName> = FontWeightValue<T>`,
    `type ScopedOf<T extends FontName> = ScopedFontWeight<T>`,
    `const divProps: DivProps = { color: 'brand', id: 'surface' }`,
    `const buttonProps: ButtonProps = { color: 'ink' }`,
    `export const held = { panelClass, chipClass, copy, primitive, fonts, tag, host, captionHost, fontNames, registry, divProps, buttonProps }`,
    `export type { WeightNameOf, WeightValueOf, ScopedOf }`,
    ``,
  ].join('\n');
}

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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-prim-10-'));
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
    fs.writeFileSync(path.join(dir, 'consumer.ts'), consumerSource());
    fs.writeFileSync(
      path.join(dir, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            strict: true,
            noEmit: true,
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            target: 'ES2022',
            lib: ['ES2022', 'DOM'],
            skipLibCheck: false,
            paths: absolute,
          },
          include: ['./consumer.ts'],
        },
        null,
        2,
      ),
    );
    const run = await runTsc(dir);
    assert.equal(
      run.code,
      0,
      `generated entry types the whole-surface consumer:\n${capped(run.text).join('\n')}`,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Third census plus the gate: after sync, the generated react entry plus the
// styled typegen output compile a consumer importing every tag, css()/recipe(),
// and every named type — the import census for the consumer surface.
export default async function run({ case: c }: SpecInput): Promise<void> {
  const paths = readWorldTsconfig(c.worldDir);
  const outDir = path.join(c.worldDir, '.reference-ui');
  for (const file of ['react/react.mjs', 'react/react.d.mts', 'styled/types/index.d.ts']) {
    assert.ok(fs.existsSync(path.join(outDir, file)), `sync published ${file}`);
  }
  await assertRuntimeSurface(outDir);
  assertDeclarationSurface(outDir);
  await typecheckConsumer(c.worldDir, paths);
}
