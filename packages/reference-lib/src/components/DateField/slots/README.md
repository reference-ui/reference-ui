# slots

The shared part registry both hosts unfold through: one slot context
carrying the authored part props (and their refs) from registration to
layout. The trigger and picker parts unfold under either host, so both
providers register into this one context; the layouts resolve the same
slot ids the parts registered.

Up: DateField.
