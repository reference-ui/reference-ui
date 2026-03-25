import type {
  RawTastyMappedModifierKind,
  RawTastyMemberKind,
  RawTastyTypeOperatorKind,
  TastySemanticKind,
} from '@reference-ui/rust/tasty'

/** Props for the `Reference` documentation component (`name` targets a symbol). */
export interface ReferenceComponentProps {
  name: string
}

export interface ReferenceJsDocTag {
  name: string
  value?: string
}

export interface ReferenceJsDoc {
  summary?: string
  description?: string
  descriptionRaw?: string
  tags: ReferenceJsDocTag[]
}

export interface ReferenceSymbolRef {
  id: string
  name: string
  kind?: string
  library?: string
}

export interface ReferenceTypeParameter {
  name: string
  constraint?: ReferenceType
  default?: ReferenceType
}

export interface ReferenceCallableParameter {
  name: string | null
  optional: boolean
  type?: ReferenceType
}

export interface ReferenceInlineMember {
  name: string
  kind: RawTastyMemberKind
  optional: boolean
  readonly: boolean
  description?: string
  descriptionRaw?: string
  jsDoc: ReferenceJsDoc
  type?: ReferenceType
}

export interface ReferenceTupleElement {
  label?: string
  optional: boolean
  rest: boolean
  element: ReferenceType
}

export type ReferenceTemplateLiteralPart =
  | {
      kind: 'text'
      value: string
    }
  | {
      kind: 'type'
      value: ReferenceType
    }

export type ReferenceType =
  | {
      kind: 'reference'
      id: string
      name: string
      library?: string
      typeArguments: ReferenceType[]
    }
  | {
      kind: 'intrinsic'
      name: string
    }
  | {
      kind: 'literal'
      value: string
    }
  | {
      kind: 'object'
      members: ReferenceInlineMember[]
    }
  | {
      kind: 'union'
      types: ReferenceType[]
    }
  | {
      kind: 'array'
      element: ReferenceType
    }
  | {
      kind: 'tuple'
      elements: ReferenceTupleElement[]
    }
  | {
      kind: 'intersection'
      types: ReferenceType[]
    }
  | {
      kind: 'indexed_access'
      object: ReferenceType
      index: ReferenceType
    }
  | {
      kind: 'function'
      params: ReferenceCallableParameter[]
      returnType: ReferenceType
    }
  | {
      kind: 'constructor'
      abstract: boolean
      typeParameters: ReferenceTypeParameter[]
      params: ReferenceCallableParameter[]
      returnType: ReferenceType
    }
  | {
      kind: 'type_operator'
      operator: RawTastyTypeOperatorKind
      target: ReferenceType
    }
  | {
      kind: 'type_query'
      expression: string
    }
  | {
      kind: 'conditional'
      checkType: ReferenceType
      extendsType: ReferenceType
      trueType: ReferenceType
      falseType: ReferenceType
    }
  | {
      kind: 'mapped'
      typeParam: string
      sourceType: ReferenceType
      nameType?: ReferenceType
      optionalModifier: RawTastyMappedModifierKind
      readonlyModifier: RawTastyMappedModifierKind
      valueType?: ReferenceType
    }
  | {
      kind: 'template_literal'
      parts: ReferenceTemplateLiteralPart[]
    }
  | {
      kind: 'raw'
      summary: string
    }

export interface ReferenceValueOption {
  label: string
  isDefault?: boolean
}

export interface ReferenceParamDoc {
  name: string
  type?: string
  typeRef?: ReferenceType
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
  kind: RawTastyMemberKind
  optional: boolean
  readonly: boolean
  declaredBy: ReferenceSymbolRef
  inheritedFrom?: ReferenceSymbolRef
  semanticKind: TastySemanticKind
  defaultValue?: string
  typeLabel: string
  type?: ReferenceType
  jsDoc: ReferenceJsDoc
  summary: ReferenceMemberSummary
}

export interface ReferenceDocument {
  id: string
  name: string
  kind: 'interface' | 'typeAlias'
  kindLabel: string
  library?: string
  warnings: string[]
  description?: string
  jsDoc: ReferenceJsDoc
  typeParameters: string[]
  typeParameterDetails: ReferenceTypeParameter[]
  extendsNames: string[]
  extends: ReferenceSymbolRef[]
  types: ReferenceSymbolRef[]
  definition: string | null
  definitionType: ReferenceType | null
  members: ReferenceMemberDocument[]
}
