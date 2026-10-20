# Call argument logic

Conditional and logical argument folding. Ternaries fold by test or union their arms; `&&`, `||`, and `??` fold by the left operand when known — each shape keeping what folds and recording a refusal for the rest.
