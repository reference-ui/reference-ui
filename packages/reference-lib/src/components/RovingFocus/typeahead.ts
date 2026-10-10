/** Compat re-export: Tree and Combobox deep-import `TypeaheadModel` and
 * `shouldIgnoreTypeaheadKey` from this path, so the module survives the
 * refactor as a shim. The implementation lives in typeahead/ (model,
 * guard); import from there for anything new. */

export * from './typeahead/model'
export * from './typeahead/guard'
