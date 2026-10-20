# Element access folding

Index reads over literals and const entries. Inline arrays and objects answer from their own slots and entries; chained reads resolve inside out through nested const maps with poisoned chains and misses reported under the outer key.
