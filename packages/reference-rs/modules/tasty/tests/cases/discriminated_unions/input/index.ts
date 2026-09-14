/**
 * Discriminated unions & narrowing test case.
 * Covers discriminated union patterns, exhaustive switching, and union of interfaces.
 */

export type {
  DiscriminatedUnion,
  Action,
  UserAction,
  SystemAction,
  ExhaustiveSwitch,
  UnionOfInterfaces,
  ApiResponse,
  LoadingResponse,
  SuccessResponse,
  ErrorResponse,
  NetworkState,
  ConnectedState,
  DisconnectedState,
  ConnectingState,
} from './discriminated-types'

export type {
  ActionHandler,
  ResponseProcessor,
  NetworkReducer,
  UnionExtractor,
} from './examples'
