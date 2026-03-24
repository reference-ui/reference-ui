/**
 * Examples using real-world patterns.
 */

import type {
  ReactComponentProps,
  ReactForwardRef,
  ReactContext,
  EventHandlerMap,
  BuilderPatternGeneric,
  ZodInfer,
  ZodSchema,
  StyledSystemProps,
  Theme,
} from './real-world-types'

// React component props example
export type ComponentExample = {
  buttonProps: ReactComponentProps<{ onClick: () => void; disabled?: boolean }>
  userInputProps: ReactComponentProps<{ value: string; onChange: (value: string) => void }>
  getPropType: <T>(props: ReactComponentProps<T>) => T
}

// React forwardRef example
export type ForwardRefExample = {
  inputRef: ReactForwardRef<HTMLInputElement, { type: string; value: string }>
  buttonRef: ReactForwardRef<HTMLButtonElement, { onClick: () => void }>
  getRefElement: <T>(forwardRef: ReactForwardRef<T>) => T
}

// React context example
export type ContextExample = {
  userContext: ReactContext<{ name: string; email: string }>
  themeContext: ReactContext<Theme>
  useUserContext: () => { name: string; email: string }
  useThemeContext: () => Theme
}

// Event handler map example
export type EventHandlerExample = {
  handlers: EventHandlerMap
  clickHandler: (e: MouseEvent) => void
  keydownHandler: (e: KeyboardEvent) => void
  getHandler: <K extends keyof HTMLElementEventMap>(event: K) => (e: HTMLElementEventMap[K]) => void
}

// Builder pattern example
export type BuilderExample = {
  userBuilder: BuilderPatternGeneric<{ name: string; age: number }>
  configBuilder: BuilderPatternGeneric<{ api: string; timeout: number }>
  buildUser: (builder: BuilderPatternGeneric<{ name: string; age: number }>) => { name: string; age: number }
  mergeConfig: <T, U>(builder: BuilderPatternGeneric<T>, other: U) => BuilderPatternGeneric<T & U>
}

// Zod infer example
export type ZodExample = {
  userSchema: ZodSchema<{ name: string; age: number }>
  postSchema: ZodSchema<{ title: string; content: string }>
  inferredUser: ZodInfer<ZodSchema<{ name: string; age: number }>>
  inferredPost: ZodInfer<ZodSchema<{ title: string; content: string }>>
  parseData: <T>(schema: ZodSchema<T>, data: unknown) => T
}

// Styled system props example
export type StyledSystemExample = {
  styledProps: StyledSystemProps
  buttonStyles: { colorPrimary?: string; marginMd?: string; fontSizeSm?: string }
  cardStyles: { colorSecondary?: string; paddingLg?: string; fontSizeMd?: string }
  getStyleProp: <K extends keyof StyledSystemProps>(props: StyledSystemProps, key: K) => StyledSystemProps[K]
}
