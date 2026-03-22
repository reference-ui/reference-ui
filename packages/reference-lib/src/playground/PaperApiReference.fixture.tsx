import type { ReactNode } from 'react'
import { Reference } from '../Reference/index.js'

/**
 * Demo-only “Paper”-style props — mirrors a typical MUI-style API table (name / type / default / description).
 * Run `ref sync` so `DocsReferencePaperProps` is indexed for {@link Reference}.
 */
export interface DocsReferencePaperProps {
  /** The content of the component. */
  children?: ReactNode

  /**
   * Override or extend the styles applied to the component. See **CSS classes API** below for more details.
   */
  classes?: object

  /**
   * The color of the component. It supports both default and custom theme colors, which can be added as shown in the **palette customization guide**.
   *
   * @default "primary"
   */
  color?:
    | 'default'
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'transparent'
    | 'error'
    | 'info'
    | 'success'
    | 'warning'
    | string

  /**
   * Shadow depth, corresponds to `dp` in the spec. It accepts values between 0 and 24 inclusive.
   *
   * @default 4
   */
  elevation?: number

  /**
   * If true, the `color` prop is applied in dark mode.
   *
   * @default false
   */
  enableColorOnDark?: boolean

  /**
   * The positioning type. The behavior of the different options is described **in the MDN web docs**. Note: `sticky` is not universally supported and will fall back to `static` when unavailable.
   *
   * TypeScript: this is a **union type** of **string literal types** (`'absolute' | …` — each branch is one literal, not `string`).
   *
   * @default "fixed"
   */
  position?: 'absolute' | 'fixed' | 'relative' | 'static' | 'sticky'

  /**
   * If `false`, rounded corners are enabled.
   *
   * @default true
   */
  square?: boolean

  /**
   * The system prop that allows defining system overrides as well as additional CSS styles. See the **`sx` page** for more details.
   */
  sx?: object
}

export default <Reference name="DocsReferencePaperProps" />
