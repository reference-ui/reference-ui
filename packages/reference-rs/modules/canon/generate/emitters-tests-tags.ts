/**
 * Test code emitters for HTML and SVG elements, JSX primitives, and rejection contracts.
 * Generates unit test assertions for lowercase DOM tag lookup and PascalCase JSX primitive recognition.
 * Emits tests verifying that hallucinated layout components like Box and Flex are rejected fail-closed.
 * Consumed by emitters-tests.ts to assemble the complete tests.rs module.
 */

export function emitRealPrimitiveTests(): string {
  return `#[test]
fn test_real_primitives_match() {
    assert!(is_reference_primitive("Div"));
    assert!(is_reference_primitive("Span"));
    assert!(is_reference_primitive("Button"));
    assert!(is_reference_primitive("P"));
    assert!(is_reference_primitive("A"));
    assert!(is_reference_primitive("B"));
    assert!(is_reference_primitive("I"));
    assert!(is_reference_primitive("Q"));
    assert!(is_reference_primitive("S"));
    assert!(is_reference_primitive("U"));
    assert!(is_reference_primitive("G"));
    assert!(is_reference_primitive("Obj"));
    assert!(is_reference_primitive("Var"));
    assert!(is_reference_primitive("Section"));
    assert!(is_reference_primitive("Nav"));
    assert!(is_reference_primitive("Header"));
    assert!(is_reference_primitive("Footer"));
    assert!(is_reference_primitive("Main"));

    // Living SVG host primitives
    assert!(is_reference_primitive("Path"));
    assert!(is_reference_primitive("Circle"));
    assert!(is_reference_primitive("G"));
    assert!(is_reference_primitive("Rect"));
    assert!(is_reference_primitive("Line"));
    assert!(is_reference_primitive("Polyline"));
    assert!(is_reference_primitive("Polygon"));
    assert!(is_reference_primitive("ClipPath"));
    assert!(is_reference_primitive("LinearGradient"));
}`;
}

export function emitLowercaseHtmlTagTests(): string {
  return `#[test]
fn test_lowercase_html_tags_match() {
    assert!(is_html_tag("div"));
    assert!(is_html_tag("span"));
    assert!(is_html_tag("object"));
    assert!(is_html_tag("var"));
    assert!(is_html_tag("button"));
    assert!(is_html_tag("p"));
    assert!(is_html_tag("a"));
    assert!(is_html_tag("b"));
    assert!(is_html_tag("i"));
    assert!(is_html_tag("q"));
    assert!(is_html_tag("s"));
    assert!(is_html_tag("u"));
    assert!(is_html_tag("g"));
    assert!(is_html_tag("path"));
    assert!(is_html_tag("circle"));
    assert!(is_reference_primitive("div"));
    assert!(is_reference_primitive("path"));
}`;
}

export function emitReactSvgTagTests(): string {
  return `#[test]
fn test_react_svg_camel_case_tags_match() {
    assert!(is_html_tag("clipPath"));
    assert!(is_html_tag("linearGradient"));
    assert!(is_html_tag("radialGradient"));
    assert!(is_html_tag("foreignObject"));

    assert!(is_primitive_jsx_name("ClipPath"));
    assert!(is_primitive_jsx_name("LinearGradient"));
    assert!(is_primitive_jsx_name("RadialGradient"));
    assert!(is_primitive_jsx_name("ForeignObject"));

    assert!(is_reference_primitive("clipPath"));
    assert!(is_reference_primitive("linearGradient"));
    assert!(is_reference_primitive("ClipPath"));
    assert!(is_reference_primitive("LinearGradient"));
}`;
}

export function emitHallucinatedPrimitiveTests(): string {
  return `#[test]
fn test_hallucinated_primitives_fail() {
    assert!(!is_reference_primitive("Box"));
    assert!(!is_reference_primitive("Flex"));
    assert!(!is_reference_primitive("Stack"));
    assert!(!is_reference_primitive("Center"));
    assert!(!is_reference_primitive("Spacer"));
    assert!(!is_reference_primitive("Badge"));
    assert!(!is_reference_primitive("Card"));
    assert!(!is_reference_primitive("Tabs"));
    assert!(!is_reference_primitive("Tab"));
    assert!(!is_reference_primitive("Portal"));
    assert!(!is_reference_primitive("AspectRatio"));
    assert!(!is_reference_primitive("Grid"));
}`;
}
