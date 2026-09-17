Harness probe: two specs over one world prove multi-spec runs, cascade wins, and the snapshot bless flow.

This case tests the harness, not the system. The world is a static
page with two swatches and a specificity duel (an id rule that must
beat a class rule). The cascade spec asserts computed styles, the
layout spec asserts geometry and takes the settled snapshot. No
baseline is committed on purpose at first: the maiden run must fail
loud with the no-baseline error, then pass after a human-gated bless.
