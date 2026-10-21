# STT-WRAP-13 — Self-referential and mutually recursive generic props trace without overflowing the stack

Four inputs type a component's props through a generic that reaches itself again. `loop.tsx` declares `Loop<T> = T | Loop<T>`, `mutual.tsx` declares `Ping<T>` and `Pong<T>` in terms of each other, and `conditional.tsx` declares a conditional whose two branches both recurse, the second through an argument that grows at every level (`Nest<Box<T>>`), and `fan.tsx` declares `Fan<T>`, which recurses twice per level with a larger argument each time.
Each expansion of a declaration with the same type arguments, resolved in their own scope, is cut by a visited guard: the repeat adds no names the first expansion did not.
An argument that grows forever never repeats, so a depth cap stops each chain and a per-session expansion budget stops the fan-out; whatever they cut contributes nothing.
The cuts in `conditional.tsx` (`Box` and `Nest` at the depth cap) and in `fan.tsx` (`Box`, `Fan` and `Bag` at the depth cap, and `Fan` at the session budget) lose no names: each refused expansion could reach only names the trace already holds (`value`, `items` and the style props), so the trace raises no `STT-W-TYPE-EXPANSION-LIMIT` warning.
Without the guard each walk recursed until the stack overflowed and the Vitest worker died, the same failure that killed `ref sync`.
Fanned, Looped, Nested and Pinged are traced with the same names as before, and the trace reports no limit.
