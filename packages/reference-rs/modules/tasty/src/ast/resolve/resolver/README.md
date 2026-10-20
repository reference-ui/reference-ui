# Per-file reference resolver

One symbol's references settled against its own scope. Each symbol resolves with its type-parameter names bound so same-named top-level symbols never capture them; keyof, indexed access, template unions, and conditionals evaluate with unsettleable shapes left absent; generics instantiate with defaulted arguments; binder marks clear once resolution completes.
