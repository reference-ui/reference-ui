import type { Component } from '@reference-ui/rust/atlas'
import type {
  ReferenceDocument,
  ReferenceMemberDocument,
} from '../reference/browser/types'
import { formatReferenceType } from '../reference/browser/model/type'
import type { McpComponent } from './types'

function getPropType(member: ReferenceMemberDocument | undefined): string | null {
  if (!member) return null
  return member.type ? formatReferenceType(member.type) : member.typeLabel
}

function toDocumentedProp(member: ReferenceMemberDocument) {
  return {
    name: member.name,
    count: 0,
    usage: 'unused' as const,
    values: undefined,
    type: getPropType(member),
    description:
      member.summary.description ??
      member.jsDoc.summary ??
      member.jsDoc.description ??
      null,
    optional: member.optional,
    readonly: member.readonly,
    defaultValue: member.defaultValue,
  }
}

export function joinMcpComponent(
  component: Component,
  document: ReferenceDocument | null
): McpComponent {
  const memberLookup = new Map(
    document?.members.map(member => [member.name, member]) ?? []
  )
  const propNames = new Set(component.props.map(prop => prop.name))
  const documentedOnlyProps =
    document?.members
      .filter(member => !propNames.has(member.name))
      .map(toDocumentedProp) ?? []

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
    props: [
      ...component.props.map(prop => {
        const member = memberLookup.get(prop.name)
        return {
          name: prop.name,
          count: prop.count,
          usage: prop.usage,
          values: prop.values,
          type: getPropType(member),
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
      ...documentedOnlyProps,
    ],
    warnings: document?.warnings ?? [],
  }
}
