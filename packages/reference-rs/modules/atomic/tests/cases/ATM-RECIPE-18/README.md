# ATM-RECIPE-18 — a compound predicate imported from another file is refused with ATM-E-RECIPE-FIELD naming compoundVariants[0].tone

A plain recipe whose compound predicate names a const string imported from another file is refused, because the compiler reads only const strings declared in the recipe's own file. The refusal carries the same message and help as a local unreadable predicate, and the refused definition is dropped whole. Related: ATM-RECIPE-16.
