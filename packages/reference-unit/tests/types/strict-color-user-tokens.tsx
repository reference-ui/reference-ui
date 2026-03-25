/**
 * Compile-time regression: `StrictColorProps` / `StylePropValue<StrictColorValue>` must
 * accept **consumer** tokens from the synced Panda theme (`Tokens["colors"]`), not only
 * a stale core checkout.
 *
 * `pnpm run test` ends with `tsc --noEmit`; if these assignments fail, the suite fails.
 *
 * Palette scale steps (`blue.300`, …) are covered in `strict-color-palette-tokens.ts`.
 */
import { Div } from '@reference-ui/react'

/** Exported so the module is a real compile target; not run by Vitest. */
export function StrictColorUserTokenSamples() {
  return (
    <>
      {/* Registered in reference-unit `src/system/styles.ts` */}
      <Div color="referenceUnitToken" bg="referenceUnitToken" />
      {/* From extend-library fixture — merged into consumer ColorToken */}
      <Div color="fixtureDemoText" bg="fixtureDemoBg" />
    </>
  )
}
