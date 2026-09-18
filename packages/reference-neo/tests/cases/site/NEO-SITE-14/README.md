# NEO-SITE-14 — with no hosts resolvable, the hostless tag yields nothing

The world styles a locally defined `<Foo mt>` with zero host imports, so
no StyleProps hosts resolve. The spec checks the synced sheet carries zero
utilities instead of scanning every tag, and the frozen request recompiled
with emptied hosts fails closed with the located `no StyleProps hosts
resolvable` error and zero wants.

Evidence: `[atm]` ATM-SITE-13 (RS-5 landed).
