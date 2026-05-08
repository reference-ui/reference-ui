import { readFileSync } from 'node:fs'
import { Liquid } from 'liquidjs'

const engine = new Liquid()

export const managedGeneratedNotice = 'This file is generated and managed by pipeline.'

export interface ManagedTemplateEntry {
  key: string
  value: string
}

export function createTemplateEntries(record: Record<string, unknown> | undefined): ManagedTemplateEntry[] {
  if (!record) {
    return []
  }

  return Object.entries(record).map(([key, value]) => ({
    key: JSON.stringify(key),
    value: JSON.stringify(value),
  }))
}

export function createTemplateValues(values: readonly unknown[]): string[] {
  return values.map(value => JSON.stringify(value))
}

export function renderManagedTemplate(
  templateUrl: URL,
  context: Record<string, unknown>,
): string {
  const templateSource = readFileSync(templateUrl, 'utf8')
  const rendered = engine.parseAndRenderSync(templateSource, context)

  return rendered.endsWith('\n') ? rendered : `${rendered}\n`
}