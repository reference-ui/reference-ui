import type { Component } from '@reference-ui/rust/atlas'
import type { ReferenceDocument } from '../reference/browser/types'
import type { McpComponent } from './types'

export function joinMcpComponent(
  component: Component,
  document: ReferenceDocument | null
): McpComponent {
  const memberLookup = new Map(
    document?.members.map(member => [member.name, member]) ?? []
  )

  return {
    name: component.name,
    source: component.source,
    count: component.count,
    usage: component.usage,
    usedWith: component.usedWith,
    examples: component.examples,
    interface: component.interface?.name
      ? {
          name: component.interface.name,
          source: component.interface.source,
        }
      : null,
    props: component.props.map(prop => {
      const member = memberLookup.get(prop.name)
      return {
        name: prop.name,
        count: prop.count,
        usage: prop.usage,
        values: prop.values,
        type: member?.typeLabel ?? null,
        description:
          member?.summary.description ??
          member?.jsDoc.summary ??
          member?.jsDoc.description ??
          null,
        optional: member?.optional ?? false,
        readonly: member?.readonly ?? false,
        defaultValue: member?.defaultValue,
      }
    }),
    warnings: document?.warnings ?? [],
  }
}
