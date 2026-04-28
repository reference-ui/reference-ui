import type { Component } from '@reference-ui/rust/atlas'
import type {
  ReferenceDocument,
  ReferenceMemberDocument,
} from '../../reference/browser/types'
import { formatReferenceType } from '../../reference/browser-model/type'
import type { McpReferenceData } from './reference'
import type { McpComponent } from './types'
import { isStylePropName } from './style-props'

function getPropType(member: ReferenceMemberDocument | undefined): string | null {
  if (!member) return null
  return member.type ? formatReferenceType(member.type) : member.typeLabel
}

function toProjectedProp(member: McpReferenceData['members'][number]) {
  return {
    name: member.name,
    count: 0,
    usage: 'unused' as const,
    values: undefined,
    type: member.type,
    description: member.description,
    optional: member.optional,
    readonly: member.readonly,
    defaultValue: member.defaultValue,
    origin: 'documented' as const,
    styleProp: isStylePropName(member.name),
  }
}

export function joinMcpComponentWithReference(
  component: Component,
  reference: McpReferenceData | null
): McpComponent {
  const memberLookup = new Map(
    reference?.members.map(member => [member.name, member]) ?? []
  )
  const propNames = new Set(component.props.map(prop => prop.name))
  const documentedOnlyProps =
    reference?.members
      .filter(member => !propNames.has(member.name))
      .map(toProjectedProp) ?? []

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
          type: member?.type ?? null,
          description: member?.description ?? null,
          optional: member?.optional ?? false,
          readonly: member?.readonly ?? false,
          defaultValue: member?.defaultValue,
          origin: 'observed' as const,
          styleProp: isStylePropName(prop.name),
        }
      }),
      ...documentedOnlyProps,
    ],
  }
}

export function joinMcpComponent(
  component: Component,
  document: ReferenceDocument | null
): McpComponent {
  return joinMcpComponentWithReference(
    component,
    document
      ? {
          members: document.members.map(member => ({
            name: member.name,
            type: getPropType(member),
            description:
              member.summary.description ??
              member.jsDoc.summary ??
              member.jsDoc.description ??
              null,
            optional: member.optional,
            readonly: member.readonly,
            defaultValue: member.defaultValue,
          })),
          warnings: document.warnings ?? [],
        }
      : null
  )
}
