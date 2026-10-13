# TST-EXT-09 — heritage-shadow: an inherited generic method keeps its own type parameter when that name is also the parent's parameter

`interface Holder<A>` declares `run<A>(input: A): A`. The method's `A` is its own parameter, so it shadows the
interface's `A`. `interface UseHolder extends Holder<number>` must inherit `keep` as `number`, but `run` must stay
generic: its return type is still a type-parameter reference named `A`, not `number`. The same holds for an object
type alias, `type Box<A> = { keep: A; run<A>(input: A): A }`, inherited through `interface UseBox extends Box<number>`.
A name-based substitution cannot tell the two `A`s apart, so the emitted reference must carry something it does not
match.
