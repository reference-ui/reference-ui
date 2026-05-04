/**
 * Palette scale tokens (`blue.300`, `gray.500`, …) must be assignable to color props when
 * the consumer's generated `ColorToken` includes them (Panda preset + theme).
 *
 * Today `StrictColorValue` is derived from `UtilityValues['backgroundColor']`; if the
 * synced `.reference-ui/styled` preset does not list scale steps in `tokens.d.ts`, this
 * errors — remove `@ts-expect-error` once `StrictColorValue` matches generated tokens.
 *
 * TODO(matrix/distro): Matrix distro proves token-safe palette values on DivProps and
 * css(), but it does not yet assert StyleProps['color'] parity for palette scale tokens.
 */
import type { StyleProps } from '@reference-ui/react'

function assertColorValue(_value: NonNullable<StyleProps['color']>): void {}

// @ts-expect-error Palette scale steps must satisfy StrictColorValue when emitted in consumer ColorToken (e.g. after preset includes full scale).
assertColorValue('blue.300')
