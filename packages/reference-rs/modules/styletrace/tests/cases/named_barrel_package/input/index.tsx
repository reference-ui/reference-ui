/**
 * Consumer entry for the named_barrel_package station.
 * Converted from fixtures/styletrace-consumer: re-exports the packaged
 * wrapper and adds a local wrapper around it. The library import points at
 * the mock fixture-style-library package remapped to node_modules.
 */
import {
  MyStyleComponent,
  type MyStyleComponentProps,
} from 'fixture-style-library'

export { MyStyleComponent } from 'fixture-style-library'

export type ConsumerStyleComponentProps = MyStyleComponentProps & {
  emphasis?: boolean
}

export function ConsumerStyleComponent(props: ConsumerStyleComponentProps) {
  return <MyStyleComponent {...props} />
}