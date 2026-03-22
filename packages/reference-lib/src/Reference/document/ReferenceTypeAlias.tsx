import { ReferenceTypeAliasDefinition } from '../components/ReferenceTypeAliasDefinition.js'

export function ReferenceTypeAlias({ definition }: { definition: string | null }) {
  return <ReferenceTypeAliasDefinition definition={definition} />
}
