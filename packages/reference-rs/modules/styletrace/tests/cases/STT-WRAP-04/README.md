# STT-WRAP-04 — A wrapper that forwards into a node_modules package is traced, and so is a package component that the entry re-exports

Traces exported wrappers that forward into a mock node_modules package.
Committed files live under input/packages/fixture-style-lib; compile remaps that tree to node_modules.
AppCard and PackageCard are both style-bearing.
