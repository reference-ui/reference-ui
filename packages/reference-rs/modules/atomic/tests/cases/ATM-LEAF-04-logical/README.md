# ATM-LEAF-04 logical

Logical extract without evaluating the guard. Falsy `&&` still yields the
literal operand. `||` and `??` collect both the left literal and the fallback.
