/**
 * Core discriminated union type definitions.
 */

// Basic discriminated union with literal type field
export type DiscriminatedUnion = 
  | { type: 'add'; value: number }
  | { type: 'remove'; id: string }

// More complex action discriminated union
export interface UserAction {
  type: 'user'
  userId: string
  action: 'create' | 'update' | 'delete'
  payload?: Record<string, unknown>
}

export interface SystemAction {
  type: 'system'
  event: string
  timestamp: number
  metadata?: Record<string, unknown>
}

export type Action = UserAction | SystemAction

// Exhaustive switch pattern with never
export type ExhaustiveSwitch<T> = T extends { type: infer U } 
  ? U extends string 
    ? T extends { type: U } 
      ? T 
      : never 
    : never 
  : never

// Union of interfaces with discriminator
export interface LoadingResponse {
  status: 'loading'
  requestId: string
}

export interface SuccessResponse {
  status: 'success'
  data: unknown
  requestId: string
}

export interface ErrorResponse {
  status: 'error'
  error: string
  requestId: string
}

export type ApiResponse = LoadingResponse | SuccessResponse | ErrorResponse

// Network state discriminated union
export interface ConnectedState {
  state: 'connected'
  connectionId: string
  lastPing: number
}

export interface DisconnectedState {
  state: 'disconnected'
  reason: 'timeout' | 'error' | 'manual'
}

export interface ConnectingState {
  state: 'connecting'
  attempt: number
  maxAttempts: number
}

export type NetworkState = ConnectedState | DisconnectedState | ConnectingState

// Union of interfaces example
export interface UnionOfInterfaces {
  kind: 'interface-union'
  data: UserAction | SystemAction | ApiResponse | NetworkState
}
