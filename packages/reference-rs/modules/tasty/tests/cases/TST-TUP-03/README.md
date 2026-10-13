# TST-TUP-03 — named-rest-tuple: a named rest tuple element keeps its label, rest flag, and array element type

A labeled rest element such as `...rest: boolean[]` lowers to the same tuple element shape as the unnamed
`...boolean[]` control: the label `rest` is kept, `rest` is true, and the element is an array.
Optional labeled elements keep their optional flag alongside their label.
