# Canon generator

Builds the Rust dictionary from living standards plus the design overlay. Ingests HTML/SVG and CSS truth from the web platform specs, joins the typed overlay (primitives, aliases, prefixes, macros, extensions, conditions) onto those tables, validates the join fail-closed, and emits zero-allocation static Rust modules. Platform, dialect, and join split the ingest and validation; emit and overlay split the printing and the curated rows.
