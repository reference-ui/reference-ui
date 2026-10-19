// Live Reference demo for the Reference component page.
// It takes nothing and emits the reference browser specimen. Colocated with the page that
// embeds it.
import { Reference } from '@reference-ui/lib'

/** The library's own ToastActionOption type, read from the types packaged with it. */
export function ReferenceDemo() {
  return <Reference name="ToastActionOption" />
}
