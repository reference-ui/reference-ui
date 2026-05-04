/**
 * Compile-time regression: `StrictColorProps` / `StylePropValue<StrictColorValue>` must
 * accept **consumer** tokens from the synced Panda theme (`Tokens["colors"]`), not only
 * a stale core checkout.
 *
 * `pnpm run test` ends with `tsc --noEmit`; if these assignments fail, the suite fails.
 *
 * TODO(matrix/distro): Add a compile-time probe for inherited consumer token names
 * that come from extends/baseSystem and fixture libraries, then retire this file.
 *
 * Palette scale steps (`blue.300`, …) are covered in `strict-color-palette-tokens.ts`.
 */
import { Div } from '@reference-ui/react'

/** Exported so the module is a real compile target; not run by Vitest. */
export function StrictColorUserTokenSamples() {
  return (
    <>
      {/* Registered in reference-unit `src/system/styles.ts` */}
      <Div color="referenceUnitToken" bg="referenceUnitToken" background="referenceUnitToken" />
      {/* From extend-library fixture — merged into consumer ColorToken */}
      <Div color="fixtureDemoText" bg="fixtureDemoBg" background="fixtureDemoBg" />
    </>
  )
}
