# chain-t9 — Full mix

**Topology:**
```
  Library A ──▶ extend ──┐
  Library B ──▶ extend ──┤
  Library C ──▶ layer  ──┼──▶ User space
  Library D ──▶ layer  ──┘
```

Two `extends` + two `layers`. Asserts bucket ordering at runtime:

```
@layer extend-library, extend-library-2, layer-library, layer-library-2, chain-t9;
```
