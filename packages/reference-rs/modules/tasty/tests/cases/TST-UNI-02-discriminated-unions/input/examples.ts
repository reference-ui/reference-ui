/**
 * Examples using discriminated unions.
 */

import type {
  Action,
  ApiResponse,
  NetworkState,
  DiscriminatedUnion,
  UserAction,
  SystemAction,
} from './discriminated-types'

// Action handler that processes different action types
export type ActionHandler = {
  handle: (action: Action) => void
  getUserActions: (actions: Action[]) => UserAction[]
  getSystemActions: (actions: Action[]) => SystemAction[]
}

// Response processor with type narrowing
export type ResponseProcessor = {
  processResponse: (response: ApiResponse) => string
  isLoading: (response: ApiResponse) => boolean
  getSuccessData: (response: ApiResponse) => unknown
  getErrorMessage: (response: ApiResponse) => string
}

// Network reducer for state management
export type NetworkReducer = {
  reduce: (state: NetworkState, event: unknown) => NetworkState
  isConnected: (state: NetworkState) => boolean
  getConnectionId: (state: NetworkState) => string | null
}

// Union extractor utility types
export type UnionExtractor = {
  extractAddValue: (union: DiscriminatedUnion) => number | null
  extractRemoveId: (union: DiscriminatedUnion) => string | null
  getUnionType: (union: DiscriminatedUnion) => 'add' | 'remove'
}
