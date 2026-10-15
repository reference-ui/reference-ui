export function Div({ children }: { children?: unknown }) {
  return <section>{children as never}</section>
}
