# ATM-RECIPE-14 — Const objects resolve in recipe fields

A recipe field that names a module-level const object literal lowers as if written inline. The fields are `base`, a variant value, a spread variant source, a whole `variants` map, an axis map, a compound's `css` and a slot entry, each lowered the way `css(name)` lowers it. Related: ATM-RECIPE-12, ATM-RECIPE-13.
