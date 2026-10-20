# Pipeline tracing

Whether a component body routes style props into a styling pipeline. Walks body statements in source order with prop bindings and the import table, marking the trace when a style signal or class-name use reaches a pipeline call across expressions, JSX, and children.
