# STT-WRAP-15 — A rest binding re-destructured in the body still forwards StyleProps to a primitive, in forwardRef and plain components

`rest.tsx` declares three components that take `{ title, ...props }` as their props parameter.
`Forwarded` (a `React.forwardRef` wrapper) and `Plain` (a plain function) each re-destructure that rest in the body, `const { role, ...restProps } = props`, and spread `restProps` into a `Div`. The rest still carries StyleProps, so both trace.
`Direct` spreads the parameter rest straight into `Div`, the control that traces with no body re-destructure.
Forwarded, Plain and Direct are all traced. The shape is the one `NumberField.Group` and `NumberField.Input` use in reference-lib.
