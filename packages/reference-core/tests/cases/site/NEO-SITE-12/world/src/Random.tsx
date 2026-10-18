// Unlisted Random component for the NEO-SITE-12 world. It takes an id plus
// style-shaped props and emits a bare div, so the anti-host probe renders
// an addressable node without touching any styling runtime.
interface RandomProps {
  fontSize?: string
  id?: string
}

export function Random(props: RandomProps) {
  return <div id={props.id}>random</div>
}
