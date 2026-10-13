# STT-NEG-01 — A component that renders a Reference primitive without exposing StyleProps is not traced

Ignores components that render Reference primitives without exposing StyleProps.
Layout renders Div but does not forward style props to callers.
The traced surface must be empty.
