# Reference UI MCP

Reference UI MCP exposes project-aware tools for components, props, style props, and tokens.

## Tools

- `getting_started`: short guide to Reference UI primitives, StyleProps, tokens, and the recommended MCP workflow.
- `list_components`: compact discovery for components observed in the project graph, including imported Reference UI primitives actually used in JSX.
- `get_component`: compact guide for one observed component, including examples, high-signal props, co-usage, and StyleProps support.
- `get_component_props`: full prop/interface readout for one component, with filters for unused props, StyleProps, query, and limit.
- `get_component_examples`: captured JSX usage examples for one component.
- `get_style_props`: shared Reference UI StyleProps guide and token category compatibility.
- `get_tokens`: flattened token catalog collected from local and extended-system token fragments. Large result sets return every matching token in compressed form; query a token path for descriptions.

## Resources

- `reference-ui://component-model`: compact component model resource for clients that prefer resource reads.
- `reference-ui://getting-started`: same start guide returned by `getting_started`, for clients that surface MCP resources.
