/**
 * In-scope wrapper for ATM-SCAN-02: imports the outside-scope Other and
 * forwards props into it, so Wrapper traces under its own name while Other
 * stays an edge target.
 */
import { Other, type OtherProps } from '../outside/Other'

export type WrapperProps = OtherProps

export function Wrapper(props: WrapperProps) {
  return <Other {...props} />
}
