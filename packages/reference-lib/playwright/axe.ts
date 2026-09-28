import { expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { AxeResults, Result } from 'axe-core'

export type { AxeResults }

/**
 * Page-skeleton rules a component mount can never satisfy: stories mount into
 * a bare gallery document, and landmarks/headings are application-owned (same
 * ownership line as component-vs-application naming in CB-A11Y-01). Disabled
 * by default so scanner halves assert component-attributable violations only.
 */
export const DEFAULT_DISABLED_RULES = [
  'landmark-one-main',
  'page-has-heading-one',
  'region',
]

export interface AxeScanOptions {
  /** CSS selector(s) scoping the scan. Default: whole page (the CT gallery holds one mounted story). */
  include?: string | string[]
  /** CSS selector(s) excluded from the scan. */
  exclude?: string | string[]
  /** Extra rule ids to skip, e.g. `['color-contrast']` (merged over the page-skeleton defaults). Prefer narrowing the case over broad disables. */
  disableRules?: string[]
  /** axe tags to run, e.g. `['wcag2a', 'wcag2aa']`. Default: axe defaults (all stable rules). */
  withTags?: string[]
}

type AxePage = ConstructorParameters<typeof AxeBuilder>[0]['page']

function buildAxe(page: Page, options: AxeScanOptions = {}) {
  // @axe-core/playwright's playwright-core peer resolves to the workspace's
  // 1.63 while CT runs 1.62: runtime-compatible (proven in-repo), one minor
  // version of Page surface apart. Single bridge point by construction.
  const builder = new AxeBuilder({ page: page as unknown as AxePage })
  if (options.include) builder.include(options.include)
  if (options.exclude) builder.exclude(options.exclude)
  if (options.withTags) builder.withTags(options.withTags)
  builder.disableRules([...DEFAULT_DISABLED_RULES, ...(options.disableRules ?? [])])
  return builder
}

/** Runs axe over the CT page and returns the raw results (report-only; never throws). */
export async function scanAxe(page: Page, options: AxeScanOptions = {}): Promise<AxeResults> {
  return buildAxe(page, options).analyze()
}

function formatViolation(violation: Result): string {
  const nodes = violation.nodes
    .slice(0, 3)
    .map((node) => `    - ${node.target.join(' ')} (${node.failureSummary ?? node.html.slice(0, 120)})`)
    .join('\n')
  const more = violation.nodes.length > 3 ? `\n    … +${violation.nodes.length - 3} more` : ''
  return `  ${violation.id} [${violation.impact ?? 'n/a'}]: ${violation.help} (${violation.nodes.length} nodes)\n${nodes}${more}`
}

/** One readable line-block per violation, for logs and failure messages. */
export function formatAxeViolations(results: AxeResults): string {
  if (results.violations.length === 0) return 'axe: 0 violations'
  return `axe: ${results.violations.length} violation(s):\n${results.violations.map(formatViolation).join('\n')}`
}

/**
 * The configured accessibility scanner for `*-A11Y-01` scanner halves: runs
 * axe after the case's state changes and fails on any violation. Automated
 * checks supplement the case's structural asserts, never replace them.
 */
export async function expectNoAxeViolations(
  page: Page,
  options: AxeScanOptions = {},
): Promise<void> {
  const results = await scanAxe(page, options)
  const report = formatAxeViolations(results)
  // String comparison keeps red output to the compact report instead of a
  // full AxeResults object diff. Callers needing raw data use scanAxe.
  expect(report, 'Accessibility scan found violations').toBe('axe: 0 violations')
}
