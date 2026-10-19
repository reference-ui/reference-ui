# CORE-SITE-14 — with no hosts resolvable, the hostless tag yields nothing

The world styles a locally defined `<Foo mt>` with zero host imports, so
no StyleProps hosts resolve from the source. The frozen request recompiled
with emptied hosts fails closed with the located `no StyleProps hosts
resolvable` error and zero wants. The synced sheet, built with Core's
primitive roster, carries one utility: `Foo` is a component nobody traces,
so its `mt` lowers under own (styling plan S3) as `core-site14__mt_4r`,
which nothing mints since `Foo` renders a plain `div`.

Evidence: ATM-SITE-13 (RS-5).

> Search terms: fail-closed, unresolvable hosts, empty registry, graceful failure, site/host-resolution, CORE-SITE-12
