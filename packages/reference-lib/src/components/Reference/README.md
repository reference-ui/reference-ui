# Reference

API reference browser: `<Reference name="SomeType" />` installs the
`@reference-ui/types` runtime and renders the indexed document for that
export — header, interface members or type definition, JSDoc, and
loading/error/empty states. `ReferenceView` is the provider-less half
for hosts that already install the runtime.

The root holds the two public components plus the status states;
`document/` renders whole documents by kind, components render
member rows, lists, and frames, `theme/` carries the browser token
config, and `fixtures/` hosts the Book cases proving the browser against
sample interfaces, aliases, and StyleProps extensions. Server rendering
pins through the colocated SSR suite.
