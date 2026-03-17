import DefaultConfig from './types'
import * as types from './types'

export interface UsesImportedTypes {
  config: DefaultConfig
  shape: types.NamespaceShape
  leaf: types.NamedLeaf
}
