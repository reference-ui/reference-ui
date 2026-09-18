// Unlisted Random component for the NEO-SYNC-15 world. It takes an id plus
// a style-shaped prop and emits a bare div, so the anti-host probe renders
// an addressable node without touching any styling runtime.
interface RandomProps {
  color?: string
  id?: string
}

export function Random(props: RandomProps) {
  return <div id={props.id}>random</div>
}
