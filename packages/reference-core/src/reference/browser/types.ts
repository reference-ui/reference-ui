export interface ReferenceProps {
  name: string
}

export interface ReferenceValueOption {
  label: string
  isDefault?: boolean
}

export interface ReferenceParamDoc {
  name: string
  type?: string
  optional?: boolean
  description?: string
}

export type ReferenceMemberTypeSummary =
  | {
      kind: 'valueSet'
      options: ReferenceValueOption[]
    }
  | {
      kind: 'callSignature' | 'typeExpression' | 'opaqueType'
      text: string
    }

export interface ReferenceMemberSummary {
  memberTypeSummary?: ReferenceMemberTypeSummary
  description?: string
  paramDocs: ReferenceParamDoc[]
}

export interface ReferenceMemberDocument {
  id: string
  name: string
  kind: string
  typeLabel: string
  summary: ReferenceMemberSummary
}

export interface ReferenceDocument {
  name: string
  kind: 'interface' | 'typeAlias'
  kindLabel: string
  description?: string
  typeParameters: string[]
  extendsNames: string[]
  definition: string | null
  members: ReferenceMemberDocument[]
}
