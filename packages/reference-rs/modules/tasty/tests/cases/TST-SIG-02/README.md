# TST-SIG-02 — accessor-pair: a get and set accessor pair in an interface is one string property, and a lone getter is readonly

Interface accessor signatures are members, not methods. `get value(): string` with `set value(next: string)`
is one property `value` typed by the getter, not writable-only, so it is not readonly. A lone getter is a
readonly property, and a lone setter is a writable property typed by its parameter. A method stays a method.
