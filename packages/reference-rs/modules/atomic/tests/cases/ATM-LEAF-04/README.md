# ATM-LEAF-04

Logical extract without evaluating the guard. Falsy `&&` still yields the
literal operand. `||` and `??` collect both arms. Contract: [SPEC.md](../../../SPEC.md).
