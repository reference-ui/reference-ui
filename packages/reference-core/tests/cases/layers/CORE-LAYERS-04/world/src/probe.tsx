// Foreign probe source for the CORE-LAYERS-04 world. It takes nothing and emits
// one capitalized, non-host JSX tag with a literal colour: the engine keeps that
// style prop as an external want, printed under one foreign group per composed
// system. The page carries the matching class in index.html and never renders it.
function Probe({ color }: { color?: string }) {
  return <span data-probe-color={color} />
}

export function Foreign() {
  return <Probe color="#15803d" />
}
