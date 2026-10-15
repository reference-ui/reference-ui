# ATL-PAIR-02 — usedWith floor, cap and rare filter bound co-usage

Verifies that Atlas reports no usedWith entries for a component found in a single file, even when that file uses it beside twenty other components.
Asserts that a component used in twenty-one files keeps at most twelve co-used names, drops pairs that score rare, and breaks count ties by name.
Proves ATL-PAIR-02, the usedWith policy in `src/usage_policy.rs` (`score_used_with`).
