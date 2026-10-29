# TST-SIG-03 — callable-members: a method, call signature, construct signature and each overload carry their parameters like a function-typed property

A method signature, a call signature and a construct signature lower to a callable type with their
parameters, return type and own type parameters, the same shape a function-typed property gets. A method
stays kind `method`. Each overload is its own member, in source order. A signature without a return
annotation returns `any`, as tsc infers.
