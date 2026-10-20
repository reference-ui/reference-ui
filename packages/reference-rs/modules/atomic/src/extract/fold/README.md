# Fold Table

One evaluator, two consumers. Every node in this directory folds a single
enumerated expression family over literal and const-resolved operands and
refuses the rest with a located refusal, and both extraction walkers — the
want walker that mints `Want`s and the plan walker that captures authored
declarations — call the same node. Want/plan parity is therefore structural:
a fold added here reaches both artifacts, and a refusal silences both with
one diagnostic.

A node is total over its family: literals, scope-resolved bindings,
transparent wrappers, and the branching forms the engine already distributes
over. Anything outside the enumerated forms is either a refusal with a
reason or a dynamic operand the want walker re-walks for its own diagnostic.
There is no `eval`, no environment mutation, no loop construct, no unknown
call — adding a language form means adding a node file, and the refusal pins
beside it keep the table honest about what still does not fold.
