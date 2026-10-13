/**
 * Indexed access through rest and optional tuple elements.
 */

export type Rest = [string, ...number[]]

export type SecondOfRest = Rest[1]

export type HeadOfRest = Rest[0]

export type ElementOfRest = Rest[number]

export type NamedRest = [head: string, ...tail: boolean[]]

export type TailOfNamed = NamedRest[2]

export type OptionalSecond = [string, number?][1]
