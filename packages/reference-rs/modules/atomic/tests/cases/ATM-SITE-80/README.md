# ATM-SITE-80

A const bound to a pure-helper call folds exactly like the direct call spelling: scalar, object, and array inits carry through the post-attach init pass, while an impure-helper init refuses with a diagnostic and keeps its static siblings.
Symbols: `fold_call_inits`, `attach_call_init`, `fold_pure_call`, `FenceValue`, `BindingInit`.
Siblings: `ATM-SITE-31` (39-F3 flips to fold), `ATM-SITE-46` (shadowed arrow folds as pure), `ATM-SITE-32` (impure tripwires).
Contract: [SPEC.md](../../../SPEC.md).

> Search terms: call init, post-attach, pure helper, fence, const call, impure refusal, dynamic identifier
