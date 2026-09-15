# AST leaking non-identifier tokens as props

**Severity:** Medium (schema pollution)
**Area:** Atlas / MCP `get_component`, `get_component_props`
**Not panda CSS.**

## Observed

`ButtonProps` includes a closing curly as an observed prop:

```json
{
  "name": "}",
  "count": 22,
  "usage": "common",
  "type": null,
  "origin": "observed",
  "styleProp": false
}
```

Likely JSX expression-container or destructure/spread parsing that treats `}` as an attribute identifier.

## Fix

Drop extracted prop names that do not match a JS/TS identifier (`/^[a-zA-Z_$][a-zA-Z0-9_$-]*$/`) before aggregating metrics.
