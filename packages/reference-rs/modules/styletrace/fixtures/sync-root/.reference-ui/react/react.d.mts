/**
 * Hand-written stand-in for the synced `@reference-ui/react` declarations. It declares only the
 * primitives the styletrace tests resolve, each in the generated form: a `<Name>Props` alias and
 * one uppercase `declare const` line, which is what the tracer reads. The prop types are reduced
 * to the StyleProps they share. This file is committed, so it is never sync output: see
 * fixtures/README.md for how to regenerate the full surface and bring names back in.
 */
import type * as React from 'react'
import type { StyleProps as NarrowStyleProps } from '@reference-ui/styled'

export type StyleProps = NarrowStyleProps

export type ButtonProps = StyleProps & Record<string, unknown>
export declare const Button: (props: ButtonProps & { ref?: React.Ref<React.ComponentRef<"button">> }) => React.ReactNode

export type DivProps = StyleProps & Record<string, unknown>
export declare const Div: (props: DivProps & { ref?: React.Ref<React.ComponentRef<"div">> }) => React.ReactNode

export type SpanProps = StyleProps & Record<string, unknown>
export declare const Span: (props: SpanProps & { ref?: React.Ref<React.ComponentRef<"span">> }) => React.ReactNode

export type SvgProps = StyleProps & Record<string, unknown>
export declare const Svg: (props: SvgProps & { ref?: React.Ref<React.ComponentRef<"svg">> }) => React.ReactNode
