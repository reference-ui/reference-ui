// 04-complex-interface.spec.ts — NEO-REF-03 oracle test 5, the complex interface port. Takes { page, url, case }
// with the world freshly synced and opens the button props page. Emits nothing on success; throws naming the
// first member, literal, signature, tag, or placeholder check that drifts from the oracle on failure.
import assert from 'node:assert/strict'
import type { NeoCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { exactTextFrequencies, openReferencePage, waitForReferenceReady } from '../../shared/ref-world.ts'

interface SpecInput {
  page: SpecPage
  url: string
  case: NeoCase
}

const MEMBERS = [
  'variant',
  'size',
  'padding',
  'currentIntent',
  'resolvedSize',
  'iconPosition',
  'toneKey',
  'resolvedTone',
  'toneLabels',
  'spacingPreview',
  'variantMeta',
  'renderIcon',
]

const LITERALS = [
  'Public button props used to exercise the live reference table.',
  '[inline: number, block: number]',
  'tone-solid',
  'tone-ghost',
  'tone-outline',
  // Split so the oracle's literal ${} survives the noTemplateCurlyInString lint.
  '{ [K in DocsReferenceButtonVariant as `tone-$' + '{K}`]: K }',
  '{ compact: 4; comfortable: 8; spacious: 12 }',
  "{ emphasis: 'high'; fill: true } | { emphasis: 'low'; fill: false }",
  'solid',
  'md',
  'start',
  'end',
  '(event: DocsReferencePressEvent, state: DocsReferenceButtonState) => void',
  '(icon: DocsReferenceIconName, size: DocsReferenceButtonSize) => string',
  '(value: string) => string',
  'Pointer event metadata from the trigger interaction.',
  'Snapshot of the button state at click time.',
  'Resolved button size.',
  'Current label text.',
  'returns',
  'Rendered icon markup.',
  'see',
  'example',
  "renderIcon('plus', 'md')",
  'deprecated',
  'Prefer a direct render override.',
  'remarks',
  'Useful for exercising non-param JSDoc tags in the browser.',
  "DocsReferenceButtonState['intent']",
  'primary',
  'danger',
]

const ABSENT_EXACT = ['mapped', 'conditional', 'indexed']

export default async function run({ page, url, case: c }: SpecInput): Promise<void> {
  await waitForReferenceReady(c.worldDir)
  const text = await openReferencePage(page, url, 'DocsReferenceButtonProps', 'renderIcon')
  assert.ok(text.includes('Reference UI reference matrix'), 'the shell heading renders')
  for (const member of MEMBERS) {
    assert.ok(text.includes(member), `the table renders ${member}`)
  }
  for (const literal of LITERALS) {
    assert.ok(text.includes(literal), `the page renders ${literal.slice(0, 48)}`)
  }
  const frequencies = await exactTextFrequencies(page)
  assert.equal(frequencies['param'] ?? 0, 5, 'the page renders five param docs')
  for (const ghost of ABSENT_EXACT) {
    assert.equal(frequencies[ghost] ?? 0, 0, `no ${ghost} placeholder leaks through`)
  }
  assert.ok(!text.includes('[tuple]'), 'no [tuple] placeholder leaks through')
}
