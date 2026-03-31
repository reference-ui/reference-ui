/**
 * Real-world pattern type definitions.
 */

// React component props patterns
export interface ReactComponentProps<T = {}> {
  props: T & { children?: React.ReactNode }
  component: React.FC<T>
}

// React forwardRef pattern
export interface ReactForwardRef<T, P = {}> {
  component: React.ForwardRefExoticComponent<P & React.RefAttributes<T>>
  ref: React.Ref<T>
}

// React context pattern
export interface ReactContext<T> {
  context: React.Context<T>
  provider: React.Provider<T>
  useContext: () => T
}

// Event handler map pattern
export type EventHandlerMap = {
  [K in keyof HTMLElementEventMap]?: (e: HTMLElementEventMap[K]) => void
}

// Builder pattern with generics
export interface BuilderPatternGeneric<T = {}> {
  build: () => T
  set: <K extends keyof T>(key: K, value: T[K]) => BuilderPatternGeneric<T>
  merge: <U>(other: U) => BuilderPatternGeneric<T & U>
}

// Zod infer pattern (simulated)
export interface ZodSchema<T> {
  parse: (data: unknown) => T
  safeParse: (
    data: unknown
  ) => { success: true; data: T } | { success: false; error: Error }
}

export type ZodInfer<T> = T extends ZodSchema<infer U> ? U : never

// Styled system props pattern
export interface Theme {
  colors: {
    primary: string
    secondary: string
    success: string
    error: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  fontSizes: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
}

export type StyledSystemProps = {
  [K in keyof Theme['colors'] as `color${Capitalize<K>}`]?: string
} & {
  [K in keyof Theme['spacing'] as `margin${Capitalize<K>}`]?: string
} & {
  [K in keyof Theme['spacing'] as `padding${Capitalize<K>}`]?: string
} & {
  [K in keyof Theme['fontSizes'] as `fontSize${Capitalize<K>}`]?: string
}

// React namespace simulation
declare namespace React {
  type FC<P = {}> = (props: P) => ReactElement | null
  type Ref<T> = RefCallback<T> | RefObject<T> | null
  type RefCallback<T> = (instance: T | null) => void
  type RefObject<T> = { readonly current: T | null }
  interface RefAttributes<T = {}> {
    ref?: Ref<T>
  }
  type ForwardRefExoticComponent<P> = P & RefAttributes<any>
  interface Context<T> {
    Provider: Provider<T>
    Consumer: Consumer<T>
  }
  interface Provider<T> {
    value: T
    children: ReactNode
  }
  interface Consumer<T> {
    children: (value: T) => ReactNode
  }
  type ReactNode = ReactElement | string | number | null | boolean
  interface ReactElement {
    type: any
    props: any
    key: any
  }
}

// Simulated React imports
interface ReactSimulated {
  FC: <P = {}>(props: P) => React.ReactElement | null
  ForwardRefExoticComponent: <P = {}>(props: P) => React.ReactElement | null
  RefAttributes: { ref?: React.Ref<any> }
  Context: <T>(defaultValue: T) => {
    Provider: React.Provider<T>
    Consumer: React.Consumer<T>
  }
  createContext: <T>(defaultValue: T) => React.Context<T>
  forwardRef: <T, P = {}>(
    render: (props: P, ref: React.Ref<T>) => React.ReactElement | null
  ) => React.ForwardRefExoticComponent<P & React.RefAttributes<T>>
  useContext: <T>(context: React.Context<T>) => T
}

declare const React: ReactSimulated
