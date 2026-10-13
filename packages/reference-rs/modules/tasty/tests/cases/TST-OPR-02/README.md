# TST-OPR-02 — keyof lists the declared keys of a plain interface, and never reports an inherited, index or call-signature key.

`keyof Plain` is `'a' | 'b'` for a plain interface. `keyof Child` is left unresolved because `Child extends Base`
inherits `a` and tasty does not merge inherited members, so a key list of `'b'` alone would be wrong. `keyof Dict`
over a `[key: string]` index signature is left unresolved, because the signature's key type (string or number) is not
recorded and the synthetic `[index]` name is never a key. A call signature contributes no key, so `keyof WithCall` is
`'c'`.
