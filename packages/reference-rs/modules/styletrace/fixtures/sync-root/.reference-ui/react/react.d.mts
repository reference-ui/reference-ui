/**
 * Hand-written stand-in for the synced `@reference-ui/react` declarations. The tracer takes the
 * primitives from the uppercase `declare const` entries below and the StyleProps type from this
 * file. Keep one primitive per line. This file is committed, so it is never sync output.
 */
import type { StyleProps as NarrowStyleProps } from '@reference-ui/styled'

export type StyleProps = NarrowStyleProps
export declare const Div: (props: StyleProps & Record<string, unknown>) => unknown
export declare const Button: (props: StyleProps & Record<string, unknown>) => unknown
