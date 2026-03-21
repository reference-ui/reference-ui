export interface ReferenceProps {
  name: string
}

export interface ReferenceMember {
  name: string
  type: string
  modifiers: string
}

export interface LoadedReferenceState {
  name: string
  kind: 'interface' | 'typeAlias'
  typeParameters: string[]
  extendsNames: string[]
  definition: string | null
  members: ReferenceMember[]
}

export type ReferenceStatus =
  | { state: 'loading' }
  | { state: 'ready'; data: LoadedReferenceState }
  | { state: 'error'; message: string }
