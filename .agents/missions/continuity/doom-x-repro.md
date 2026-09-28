# Doom REPRODUCE — CONTINUITY-01 / continuity-x

Verdict: **REPRODUCED**

## Replay

Blind-runnable, unmodified artifact `/tmp/doom-continuity-x-condition-miss.mts`:

```
cd /Users/ryn/Developer/reference-ui && ./packages/reference-neo/node_modules/.bin/tsx /tmp/doom-continuity-x-condition-miss.mts
```

Result: exit 1.

## Evidence (quoted output)

```
condition miss class: ""
condition miss warns: []
AssertionError [ERR_ASSERTION]: RED: condition miss serves a miss class
    at <anonymous> (/private/tmp/doom-continuity-x-condition-miss.mts:99:8)
EXIT=1
```

## Controls

All three controls passed (script reached the RED assertion at line 99,
so none of the control asserts at lines 73–91 tripped):

- Control 1 (hit, `color:red`): non-empty class, zero warns.
- Control 2 (value miss, `#b4d455`): miss class + exactly one warn naming prop/value/site.
- Control 3 (unknown-prop miss, `frobnicate`): miss class + exactly one warn.

## Conclusion

`css({ _wat: { color: 'red' } })` serves `""` with zero diagnostics while
all miss-path controls behave — matches the finder claim exactly. No
divergence. No fixes attempted (later crew).
