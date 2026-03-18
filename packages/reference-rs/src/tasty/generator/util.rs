use serde::Serialize;

pub(super) fn to_js_literal<T: Serialize + ?Sized>(value: &T) -> Result<String, String> {
    serde_json::to_string(value)
        .map_err(|error| format!("Failed to serialize artifact value: {error}"))
}

pub(super) fn emit_object(fields: Vec<String>) -> String {
    format!("{{\n{}\n}}", fields.join(",\n"))
}

pub(super) fn emit_array(items: Vec<String>) -> String {
    if items.is_empty() {
        "[]".to_string()
    } else {
        format!("[\n{}\n]", items.join(",\n"))
    }
}

pub(super) fn emit_field(name: &str, value: String) -> String {
    let value = if value.contains('\n') {
        indent_block(&value, 2)
    } else {
        value
    };

    format!("  {name}: {value}")
}

pub(super) fn indent_block(value: &str, spaces: usize) -> String {
    let indent = " ".repeat(spaces);
    value
        .lines()
        .map(|line| format!("{indent}{line}"))
        .collect::<Vec<_>>()
        .join("\n")
}
