# STT-NEG-06 — A higher-order component applied to an argument that names no component is not traced and warns

`withPad` forwards its StyleProps into its parameter. Applied to `makeBase()`, a call that names no component binding, the export Unresolved cannot be traced, so the trace emits one `STT-W-UNRESOLVED-HOC-ARGUMENT` warning rather than guessing.
The same HOC applied to the Reference primitive Div (Padded) still traces.
