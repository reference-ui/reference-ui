# CORE-CHAIN-11 — a cycle reached through fragment names fails sync with a named error

The world is an app that extends an upstream base system, `loop`. The loop's published fragment list
names the app itself as one of its nodes: `loop` was published while it extended the app, so its
`fragments` carry the app's name, and the app's own name is reachable only through that list. The loop
publishes no `streams`, so the cycle is reachable through fragment names alone (E7).

The spec wires the loop into the app's `ui.config`, runs a real `sync()`, and asserts the sync rejects
with the named error: the `extends` field, the loop entry, the name it reaches, and that the name is the
app's own. It then checks that the published base system on disk is byte-identical before and after the
rejected sync, so a cycle never overwrites the last good output. The canonical config is restored with a
heal sync in a `finally`.

The check is `validateBaseSystemLinks` in the base-system link check: `reachesOwnName` reads the entry's
fragment node names as well as its name and stream names. Before E7 covered fragment names, this cycle
passed validation, because neither the entry's name nor its streams reach the app.

Evidence: the base-system link check (`reachesOwnName`, `validateBaseSystemLinks`), config validation
(`validateBaseField`). Siblings: CORE-LAYERS-14 (the streams cycle and the other relation rejections), CORE-CHAIN-02
(the diamond whose nodes the check must not reject).

> Search terms: cycle, fragment names, own name, self-named, extends, named error, validation, E7, published fragment list, CORE-LAYERS-14, CORE-CHAIN-02
