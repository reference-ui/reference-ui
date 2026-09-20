// scan.spec.ts — spec for NEO-PARITY-04, the panda-ism scan. Takes { case }
// from the runner with the mini-lib world freshly synced; the page stays
// parked because the scan is node-side over the generated folder. Emits
// nothing on success; throws naming the first forbidden string or config
// file found on failure. The matrix data-panda-theme pin is the recorded
// reason P1 asserts absence rather than compatibility (see the README).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

const FORBIDDEN = ['panda', 'data-panda-theme', '--made-with-panda', '@pandacss'];

function generatedFiles(outDir: string): string[] {
  const out: string[] = [];
  const walk = (current: string): void => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(full);
    }
  };
  walk(outDir);
  return out.sort();
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const files = generatedFiles(outDir);
  assert.ok(files.length > 0, 'sync published a generated folder to scan');

  for (const file of files) {
    const rel = path.relative(outDir, file);
    assert.ok(
      !/^panda\.config\./.test(path.basename(file)),
      `no panda.config.* in the generated folder, found ${rel}`,
    );
    // The debug map embeds tool sources verbatim; the sweep targets shipped bytes.
    if (file.endsWith('.map')) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const needle of FORBIDDEN) {
      assert.ok(!text.includes(needle), `no ${needle} in the generated folder, found in ${rel}`);
    }
  }
}
