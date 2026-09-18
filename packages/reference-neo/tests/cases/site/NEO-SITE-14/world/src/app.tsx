// Entry for the NEO-SITE-14 world. It takes no host imports at all and
// emits style attrs onto a locally defined tag, so the engine finds no
// StyleProps hosts resolvable and must fail closed with its diagnostic.
interface FooProps {
  mt?: string
  children?: string
}

function Foo(props: FooProps) {
  return <div>{props.children}</div>
}

export const Card = () => <Foo mt="4r">hostless</Foo>
