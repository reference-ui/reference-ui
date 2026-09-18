// macro.spec.ts — spec for NEO-SITE-13, the boolean-macro case. Takes
// { page, case } from the runner with the world freshly synced and the page
// already navigated to it. Emits nothing on success; throws naming the
// missing macro utility, the missing style plan, or the unpainted border.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { NeoCase } from '../../../../shared/cases.ts';
import type { SpecPage } from '../../../../shared/page.ts';
import type { NativeRuntimeArtifact } from '@reference-ui/rust/contracts';

interface SpecInput {
  page: SpecPage;
  case: NeoCase;
}

interface RuntimeDataModule {
  systemName: string;
  runtimeData: NativeRuntimeArtifact;
}

// The valueless attr lowers to the width + style utilities with one style
// plan carrying both declarations; the probe carries both classes and
// paints the 1px solid border while the plain control stays borderless.
export default async function run({ page, case: c }: SpecInput): Promise<void> {
  const outDir = path.join(c.worldDir, '.reference-ui');
  const styles = fs.readFileSync(path.join(outDir, 'styled/styles.css'), 'utf8');
  assert.ok(
    styles.includes('.neo-site13__bd-w_1px { border-width: 1px; }'),
    'sheet carries the macro width utility',
  );
  assert.ok(
    styles.includes('.neo-site13__border-style_solid { border-style: solid; }'),
    'sheet carries the macro style utility',
  );

  const dataUrl = new URL('file://' + path.join(outDir, 'styled/runtime-data.mjs')).href;
  const data = (await import(dataUrl)) as RuntimeDataModule;
  const plans = data.runtimeData.stylePlans.filter(
    (plan) => plan.prop === 'border' && plan.value === true,
  );
  assert.equal(plans.length, 1, `runtime carries one border:true plan, got ${plans.length}`);
  const slots = plans[0]?.declarations.map((decl) => decl.slot).sort() ?? [];
  assert.deepEqual(slots, ['borderStyle', 'borderWidth'], 'the plan carries both slots');

  const probe = page.locator('#probe');
  await probe.waitFor();
  const className = await probe.evaluate((el) => (el as HTMLElement).className);
  assert.ok(
    className.includes('neo-site13__bd-w_1px') && className.includes('neo-site13__border-style_solid'),
    `probe carries both macro classes, got ${className}`,
  );
  assert.equal(
    await probe.evaluate((el) => getComputedStyle(el).borderTopWidth),
    '1px',
    'probe paints the macro width',
  );
  assert.equal(
    await probe.evaluate((el) => getComputedStyle(el).borderTopStyle),
    'solid',
    'probe paints the macro style',
  );

  const control = page.locator('#control');
  await control.waitFor();
  assert.equal(
    await control.evaluate((el) => getComputedStyle(el).borderTopStyle),
    'none',
    'plain control stays borderless',
  );
}
