# Extract passes

Oxc-facing parsing into symbol shells and lowered types. Statements dispatch to import, export, and symbol collection; types lower with enclosing binders bound; members, namespaces, comments, values, and bindings each own a pass behind one shared context.
