/**
 * Second entry for the entry_scope station: forwards the package Edge's
 * own props type into Edge, so Other traces under its own name.
 */
import { Edge, type EdgeProps } from 'fixture-edge-lib'

export type OtherProps = EdgeProps

export function Other(props: OtherProps) {
  return <Edge {...props} />
}
