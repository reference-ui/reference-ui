# Reference UI MCP for LLMs

Reference UI MCP is a compact, project-aware reference for components, props, style props, and tokens.

## Recommended Flow

1. Start with `list_components` to discover the local component inventory.
2. Use `get_component` for a compact readout of one component: usage, examples, common props, co-usage, and whether StyleProps are supported.
3. Use `get_component_props` only when you need the exhaustive prop/interface list for one component.
4. Use `get_style_props` for the shared Reference UI StyleProps model instead of asking each component to repeat inherited CSS-style props.
5. Use `get_tokens` to inspect project token paths, categories, values, light/dark overrides, and descriptions.

## Why The Split Exists

Many Reference UI primitives and primitive-like components accept `StyleProps`. That surface can include hundreds of CSS-style props. LLMs already know most CSS property names, so component responses should not repeat the entire inherited style interface.

The compact tools keep component discovery fast while preserving real usage data from Atlas. The full tools are explicit escape hatches for cases where the assistant really does need exhaustive details.

## Tool Summary

- `list_components`: component discovery with usage, source, interface, observed prop preview, and StyleProps marker.
- `get_component`: compact component guide with examples and high-signal props.
- `get_component_props`: exhaustive prop readout with filters for unused documented props, StyleProps, query, and limit.
- `get_component_examples`: captured usage examples for one component.
- `get_common_patterns`: components commonly used near another component.
- `get_style_props`: shared StyleProps categories and token compatibility.
- `get_tokens`: flattened project token catalog.

## StyleProps

Style-bearing components expose a `styleProps` marker in component responses. When `supported` is true, call `get_style_props` for the shared style prop guide. Observed style props may still appear in compact component output because those came from real project usage.

## Tokens

`get_tokens` reports tokens collected from user token fragments. Token leaves preserve `value`, `light`, `dark`, and `description` when present.
