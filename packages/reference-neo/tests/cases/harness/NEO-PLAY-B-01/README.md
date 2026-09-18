Harness probe: cascade wins, theme flips, and snapshot compare behavior over one small world.

This case tests the harness, not a system. Two specs share one world:
the cascade spec asserts computed-style patterns (specificity wins,
theme class flips repaint the swatch), and the snapshot spec drives
the settled-state facility both through the runner (blessed baseline)
and directly (pure pixel-compare probes with generated fixtures plus
the invalid-name refusal). If this case runs green, multi-spec runs,
computed assertions, and the snapshot bless flow all work end to end.

> Search terms: theming, theme toggle, pixel diff, negative test, probe b, harness/snapshots, harness/bless, harness/cascade, harness/theme, NEO-SNAP-A-01
