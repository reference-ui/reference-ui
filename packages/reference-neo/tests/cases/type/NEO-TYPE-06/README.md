# NEO-TYPE-06 — no @pandacss import anywhere in the generated folder

After `sync()`, no file under the world's `.reference-ui/` mentions
`@pandacss`: the declarations are native typegen plus authored entries, with
no Panda type re-export or module augmentation. The world is the TYPE-01 token
set; the spec walks the generated folder asserting zero matches and asserts
the brand probe paints.

No engine rung beyond R1's emit-string check (`emitDtsSync` output mentions
no `@pandacss`, no atomic class names, no jsx farm); no host change was
needed.

Evidence: PLAN §4.1 forbidden; TYP-NATIVE-06.
