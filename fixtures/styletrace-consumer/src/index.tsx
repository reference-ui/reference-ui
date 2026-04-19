import {
  MyStyleComponent,
  type MyStyleComponentProps,
} from '@fixtures/styletrace-library'

export { MyStyleComponent } from '@fixtures/styletrace-library'

export type ConsumerStyleComponentProps = MyStyleComponentProps & {
  emphasis?: boolean
}

export function ConsumerStyleComponent(props: ConsumerStyleComponentProps) {
  return <MyStyleComponent {...props} />
}