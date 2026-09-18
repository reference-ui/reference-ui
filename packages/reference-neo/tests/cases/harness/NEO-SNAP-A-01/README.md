Harness probe: two specs over one world prove multi-spec runs, cascade wins, and the snapshot bless flow.

This case tests the harness, not the system. The world is a static
page with two swatches and a specificity duel (an id rule that must
beat a class rule). The cascade spec asserts computed styles, the
layout spec asserts geometry and takes the settled snapshot. The
baseline is committed and human-eyeballed: any drift fails loud until
a human re-blesses with --update-snapshots --confirm.

> Search terms: visual regression, golden, baseline drift, id selector, snapshot testing, probe a, harness/snapshots, harness/bless, harness/multi-spec, harness/cascade, NEO-PLAY-B-01
