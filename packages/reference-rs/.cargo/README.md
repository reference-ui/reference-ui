# Cargo config

Workspace-local Cargo settings. Redirects the target directory into the distribution tree so build scratch never pollutes the checkout, and sets the `ts-rs` environment so generated TypeScript uses the `.js` import extension with exports relative to each crate.
