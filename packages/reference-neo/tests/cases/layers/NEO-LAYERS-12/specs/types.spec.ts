// types.spec.ts — spec for NEO-LAYERS-12, the generated ReferenceUIConfig. It takes { case } with the
// world synced by the runner. It typechecks a consumer that calls defineConfig from the generated
// @reference-ui/system entry with name, include, extends, layers, strict, staticCss and logs, and a
// control consumer with an undeclared key that must fail with TS2353. Emits nothing on success; throws
// naming the tsc diagnostics that broke the check on failure.
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

interface TscRun {
  code: number | null;
  lines: string[];
}

const MAX_LINES = 40;

// Every field the generated ReferenceUIConfig must carry, in one defineConfig call.
const CONSUMER = `import { baseSystem, defineConfig } from '@reference-ui/system'

export const config = defineConfig({
  name: 'consumer',
  include: ['src/**/*.ts'],
  extends: [baseSystem],
  layers: [baseSystem],
  strict: ['colors', 'spacing'],
  staticCss: { color: ['red', 'blue'] },
  logs: ['compiler'],
})
`;

// A key the generated type does not declare: tsc must reject it, so the type is narrow, not wide.
const UNKNOWN_KEY = `import { baseSystem, defineConfig } from '@reference-ui/system'

export const config = defineConfig({
  name: 'consumer',
  include: ['src/**/*.ts'],
  notAField: baseSystem,
})
`;

function tscBin(): string {
  const pkgFile = createRequire(import.meta.url).resolve('typescript/package.json');
  return path.join(path.dirname(pkgFile), 'bin', 'tsc');
}

function runTsc(cwd: string): Promise<TscRun> {
  return new Promise((resolve) => {
    execFile(process.execPath, [tscBin(), '--noEmit', '-p', cwd], { timeout: 180000 }, (err, stdout, stderr) => {
      if (err && (err.killed || (err as { code?: unknown }).code === 'ETIMEDOUT')) {
        resolve({ code: null, lines: ['tsc timed out after 180s'] });
        return;
      }
      const text = `${stdout}\n${stderr}`;
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      resolve({ code: err ? ((err as { code?: number }).code ?? 1) : 0, lines });
    });
  });
}

// Typechecks one consumer in a temp project whose @reference-ui/system is the world's generated entry.
async function typecheck(worldDir: string, source: string): Promise<TscRun> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'neo-layers-12-'));
  try {
    const entry = path.join(worldDir, '.reference-ui', 'system', 'system.d.mts');
    fs.writeFileSync(path.join(dir, 'consumer.ts'), source);
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
            paths: { '@reference-ui/system': [entry] },
          },
          include: ['./consumer.ts'],
        },
        null,
        2
      )
    );
    return await runTsc(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const entry = path.join(c.worldDir, '.reference-ui', 'system', 'system.d.mts');
  assert.ok(fs.existsSync(entry), 'sync published the generated system entry types');

  const full = await typecheck(c.worldDir, CONSUMER);
  assert.equal(
    full.code,
    0,
    `a consumer with layers, strict, staticCss and logs typechecks:\n${full.lines.slice(0, MAX_LINES).join('\n')}`
  );

  const control = await typecheck(c.worldDir, UNKNOWN_KEY);
  assert.notEqual(control.code, 0, 'a consumer with an undeclared key fails to typecheck');
  assert.ok(
    control.lines.some((line) => line.includes('TS2353') && line.includes('notAField')),
    `the control fails with TS2353 on notAField:\n${control.lines.slice(0, MAX_LINES).join('\n')}`
  );
}
