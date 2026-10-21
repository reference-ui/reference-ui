# React entry generator

Writes the bound per-system React entry source plus its complete type declarations. The type bake narrows primitive types per system — compiled style-prop names, system style objects, the recipe-union variant only when recipes exist — and the synced role decides the system register: a publisher declares it, a consumer does not.

The producer-to-consumer contract (`consumer.contract.test.ts`) stages these declarations, and the typegen styled types, where the style-prop tracer resolves them. It then runs the real compile over one probe per exported type, so a tracer crash fails the suite instead of the worker.
