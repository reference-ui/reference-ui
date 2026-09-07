import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import {
  findComponentDoc,
  parseComponentDoc,
} from './component-docs'

describe('component-docs', () => {
  it('parses a basic component markdown doc', () => {
    const markdown = `# Widget

Proof: [TESTS.md](./TESTS.md).

A high-performance widget for assembling dashboards and charts.

\`\`\`tsx
<Widget variant="card">
  <Widget.Header title="Analytics" />
  <Widget.Body>
    <P>Chart goes here</P>
  </Widget.Body>
</Widget>
\`\`\`

## Proposed API
- \`Widget.Header\`: Header container for title and actions.
- \`Widget.Body\`: Main content container.
`

    const doc = parseComponentDoc(markdown, 'Widget')
    expect(doc.name).toBe('Widget')
    expect(doc.description).toBe('A high-performance widget for assembling dashboards and charts.')
    expect(doc.examples.length).toBe(1)
    expect(doc.examples[0]).toContain('<Widget variant="card">')
    expect(doc.anatomy?.pattern).toBe('compound')
    expect(doc.anatomy?.parts.map((p: { name: string }) => p.name)).toEqual(['Widget.Header', 'Widget.Body'])
  })

  it('extracts compound parts and required props from examples and static assignments', () => {
    const markdown = `# Splitter\n\nA resizable panel splitter.\n\n\`\`\`tsx\n<Splitter>\n  <Splitter.Panel defaultSize={50} min={20} />\n</Splitter>\n\`\`\`\n`
    const source = `
export const SplitterPanel = () => null

Splitter.Panel = SplitterPanel
`
    const doc = parseComponentDoc(markdown, 'Splitter', source)
    expect(doc.anatomy?.pattern).toBe('compound')
    const panelPart = doc.anatomy?.parts.find((p: { name: string }) => p.name === 'Splitter.Panel')
    expect(panelPart).toBeDefined()
    expect(panelPart?.requiredProps).toContain('defaultSize')
    expect(panelPart?.requiredProps).toContain('min')
  })

  it('parses single non-compound component docs', () => {
    const markdown = `# SimpleBadge

A tiny badge component for numeric counters.

\`\`\`tsx
<SimpleBadge count={5} />
\`\`\`
`
    const doc = parseComponentDoc(markdown, 'SimpleBadge')
    expect(doc.anatomy?.pattern).toBe('single')
    expect(doc.anatomy?.parts).toEqual([])
  })

  it('reads real component doc for Accordion from reference-lib if present', () => {
    const libRoot = resolve(__dirname, '../../../reference-lib')
    const doc = findComponentDoc(libRoot, 'Accordion', './components/Accordion/Accordion.tsx')
    expect(doc).not.toBeNull()
    expect(doc?.description).toContain('Coordinates a collection of Collapsibles')
    expect(doc?.examples.length).toBeGreaterThan(0)
    expect(doc?.examples[0]).toContain('<Accordion')
  })

  it('reads real component doc for Tabs from reference-lib if present', () => {
    const libRoot = resolve(__dirname, '../../../reference-lib')
    const doc = findComponentDoc(libRoot, 'Tabs', './components/Tabs/Tabs.tsx')
    expect(doc).not.toBeNull()
    expect(doc?.description).toContain('Built on `RovingFocus`')
    expect(doc?.anatomy?.pattern).toBe('compound')
    expect(doc?.anatomy?.parts.map((p: { name: string }) => p.name)).toContain('Tabs.List')
    expect(doc?.anatomy?.parts.map((p: { name: string }) => p.name)).toContain('Tabs.Tab')
    expect(doc?.anatomy?.parts.map((p: { name: string }) => p.name)).toContain('Tabs.Panel')
  })

  it('parses MDX component doc with frontmatter', () => {
    const mdx = `---
title: Stepper
description: Multi-step process workflow control.
---

# Stepper

A sequential progress and step navigation container.

\`\`\`tsx
<Stepper currentStep={2}>
  <Stepper.Step title="Account" />
  <Stepper.Step title="Billing" />
  <Stepper.Step title="Confirm" />
</Stepper>
\`\`\`
`
    const doc = parseComponentDoc(mdx, 'Stepper')
    expect(doc.name).toBe('Stepper')
    expect(doc.description).toBe('A sequential progress and step navigation container.')
    expect(doc.anatomy?.pattern).toBe('compound')
    expect(doc.anatomy?.parts.map((p: { name: string }) => p.name)).toEqual(['Stepper.Step'])
    expect(doc.examples.length).toBe(1)
  })
})
