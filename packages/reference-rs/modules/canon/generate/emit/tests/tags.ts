/**
 * Test code emitters for HTML and SVG elements, JSX primitives, and rejection contracts.
 * Generates unit test assertions for lowercase DOM tag lookup and PascalCase JSX primitive recognition.
 * Emits tests verifying that hallucinated layout components like Box and Flex are rejected fail-closed.
 * Consumed by emit/tests/index.ts to assemble the complete tests.rs module.
 */

export function emitCanTag01(): string {
  return `#[test]
fn can_tag_01_pascal_jsx_primitives() {
    let tags = [
        "Div", "Span", "Button", "P", "A", "B", "I", "Q", "S", "U", "G", "Obj", "Var",
        "Section", "Nav", "Header", "Footer", "Main", "Path", "Circle", "Rect", "Line",
        "Polyline", "Polygon", "ClipPath", "LinearGradient",
    ];
    for tag in tags {
        assert!(is_reference_primitive(tag));
        assert!(is_primitive_jsx_name(tag));
    }
}`;
}

export function emitCanTag02(): string {
  return `#[test]
fn can_tag_02_lowercase_html_svg_tags() {
    let tags = [
        "div", "span", "object", "var", "button", "p", "a", "b", "i", "q", "s", "u", "g",
        "path", "circle",
    ];
    for tag in tags {
        assert!(is_html_tag(tag));
    }
    assert!(is_reference_primitive("div"));
    assert!(is_reference_primitive("path"));
}`;
}

export function emitCanTag03(): string {
  return `#[test]
fn can_tag_03_reserved_tag_renames() {
    assert!(is_primitive_jsx_name("Obj"));
    assert!(is_reference_primitive("Obj"));
    assert!(is_primitive_jsx_name("Var"));
    assert!(is_reference_primitive("Var"));

    assert!(is_html_tag("object"));
    assert!(is_html_tag("var"));
}`;
}

export function emitCanTag04(): string {
  return `#[test]
fn can_tag_04_single_letter_tags() {
    let single_letter_tags = ["A", "P", "B", "I", "Q", "S", "U", "G"];
    for tag in single_letter_tags {
        assert!(is_reference_primitive(tag));
        assert!(is_primitive_jsx_name(tag));
    }
}`;
}

export function emitCanTag05(): string {
  return `#[test]
fn can_tag_05_react_svg_camel_case() {
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

export function emitCanFail01(): string {
  return `#[test]
fn can_fail_01_hallucinated_primitives() {
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

export function emitTagTests(): string {
  return [
    emitCanTag01(),
    emitCanTag02(),
    emitCanTag03(),
    emitCanTag04(),
    emitCanTag05(),
    emitCanFail01(),
  ].join('\n\n');
}
