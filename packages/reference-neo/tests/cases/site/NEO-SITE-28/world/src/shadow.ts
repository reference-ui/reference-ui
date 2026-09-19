// Shadow wrapper for the NEO-SITE-28 world. It takes a style object and
// emits an empty class name: a consumer declaration named `css`, not
// Reference identity, so the miss node must paint nothing with zero
// diagnostics — a silent non-site.
export const css = (_style: object): string => ''
