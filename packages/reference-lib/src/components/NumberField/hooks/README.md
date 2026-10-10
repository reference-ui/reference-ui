# hooks

React bindings over the field's sessions: one hook per behavior, data
and handlers out, no JSX. Formatting validates props and derives the
Intl layer with no effects; the edit session owns the draft buffer,
the echo and replacement generations, and the caret replay; step
actions request lattice advances as commit boundaries; edit handlers
stage text, suspend for composition, and flush through the pure commit
decision; the insert guard validates paste in native listeners; field
identity pins the shared Input id and runs the environment diagnostics;
form wiring observes submit and reset with post-reset sync. The stepper
name gate and press-and-hold machine serve both steppers from the parts.
The root only composes them in their original effect order and publishes
the result as context.
