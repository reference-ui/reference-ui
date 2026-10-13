# Members

Turns Oxc interface and object-type signatures into `TsMember` values, including leading-comment
metadata and the `TypeRef` of each member's type.

Each signature keeps its source position: a property, method, call, construct, or index signature
becomes one member. An accessor pair (a `get` and a `set` of one name) folds into a single property
member, typed by the getter's return type or, when only a setter exists, by its parameter type, and
readonly only while no setter is present.

Member types lower with the enclosing binder names bound, and a method, call, or construct signature
also binds its own type parameters. Interface and type-alias parameters are bound later, by the resolver.
