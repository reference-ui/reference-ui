// Untraced Label component for the NEO-SYNC-15 world. It takes only plain
// props and emits a bare span, so its boundary carries no style props for
// the tracer to find even though the file sits inside the entry set.
interface LabelProps {
  text: string
  id?: string
}

export function Label(props: LabelProps) {
  return <span id={props.id}>{props.text}</span>
}
