# Resolver

The resolver expands the Reference UI style-prop surface from TypeScript source.

It starts from `StyleProps`, follows imports and re-exports, instantiates simple
generic aliases, and returns a concrete set of property names.

## Layout

Parsing turns one TypeScript file into a parsed module: its imports, re-exports,
`export *` sources and declarations. Type annotations are lowered into a small
type graph while they are parsed, and the type lowering is split by form so each
dispatch stays small.

The tracer resolves a reference against that graph in separate passes: the
property pass collects style-prop names, the literal pass collects keys from
unions, `keyof` and mapped types, and the declaration pass binds type arguments
into an interface or alias before it expands the declaration. Built-in utility
types are handled apart from all three, and the model, error and path helpers
sit beside them.
