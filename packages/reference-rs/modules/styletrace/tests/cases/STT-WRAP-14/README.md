# STT-WRAP-14 — A depth-cut alias chain warns STT-W-TYPE-EXPANSION-LIMIT; a mutual loop is silent

`chain.tsx` declares `Link0 = StyleProps` and `Link1` through `Link64`, each naming the one before. `Chained`'s props are typed as `Link64`.
The trace expands one declaration per level. The sixty-fifth expansion, `StyleProps` itself, would sit beyond the depth cap of 64, so it is refused and `Chained` traces nothing.
The refusal is no longer silent: the trace raises one `STT-W-TYPE-EXPANSION-LIMIT` warning naming `StyleProps`, its file and the depth limit, located at `chain.tsx`.
`loop.tsx` declares `Ping = Pong & StyleProps` and `Pong = Ping & { tone?: string }`. Expanding `Ping` reaches `Pong` while `Pong` is still being expanded, a repeat of an expansion in progress that adds no names, so that repeat is refused silently and `Looped` traces with no warning.
Looped is traced; Chained is untraced and warned.
