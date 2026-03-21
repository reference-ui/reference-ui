export interface ReferenceProps {
  name: string
}

export interface ReferenceTag {
  label: string
  highlighted?: boolean
}

export interface ReferenceParamDoc {
  name: string
  type?: string
  optional?: boolean
  description?: string
}

export interface ReferenceMemberDocument {
  id: string
  name: string
  kind: string
  typeLabel: string
  tags: ReferenceTag[]
  description?: string
  params: ReferenceParamDoc[]
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
