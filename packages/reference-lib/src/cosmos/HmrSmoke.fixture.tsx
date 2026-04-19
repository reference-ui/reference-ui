import { Div } from '@reference-ui/react'

/**
 * Minimal Cosmos fixture for checking Vite HMR (no MDX).
 * Edit the copy or styles below and save — the preview should update without a full reload.
 */
export default function HmrSmokeFixture() {
  return (
    <Div padding="5r" fontFamily="reference.sans">
      <Div fontSize="lg" fontWeight="600" marginBottom="2r">
        HMR smoke
      </Div>
      <Div color="red.300">
        Change this sentence or the styles above, then save to verify hot reload...blah
      </Div>
    </Div>
  )
}
