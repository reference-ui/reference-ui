//! CSS identifier escaping and character hygiene for generated atomic class names.
//! Replaces whitespace with delimiters and escapes special punctuation such as slashes, colons, and brackets for CSS selectors.
//! Ensures class selectors remain syntactically valid in both raw stylesheets and browser DOM attributes.

/// Sanitize value string for inclusion in HTML class names (converts whitespace to underscores).
pub fn sanitize_class_value(val: &str) -> String {
    let mut out = String::with_capacity(val.len());
    for ch in val.chars() {
        match ch {
            ' ' | '\t' | '\n' => out.push('_'),
            _ => out.push(ch),
        }
    }
    out
}

/// Escapes special CSS selector characters (e.g. colons, slashes, dots) for stylesheet rules.
pub fn escape_css_selector(val: &str) -> String {
    let mut out = String::with_capacity(val.len() + 8);
    for ch in val.chars() {
        match ch {
            ':' | '/' | '.' | '!' | '[' | ']' | '(' | ')' | '%' | '#' | ',' | '&' | '=' | '@'
            | '>' | '+' | '~' | '{' | '}' | '"' | '\'' => {
                out.push('\\');
                out.push(ch);
            }
            _ => out.push(ch),
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sanitize_class_value() {
        assert_eq!(sanitize_class_value("10px 20px"), "10px_20px");
        assert_eq!(sanitize_class_value("3px solid"), "3px_solid");
    }

    #[test]
    fn test_escape_css_selector() {
        assert_eq!(escape_css_selector("hover:mt_2r"), "hover\\:mt_2r");
        assert_eq!(escape_css_selector("p_1/2r"), "p_1\\/2r");
        assert_eq!(escape_css_selector("bg_blue.600"), "bg_blue\\.600");
        assert_eq!(escape_css_selector("mt_2r!"), "mt_2r\\!");
    }
}
