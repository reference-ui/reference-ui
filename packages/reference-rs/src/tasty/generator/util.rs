//! JavaScript object/array/string emission for artifact modules.

use std::fmt::Write as _;

use serde::Serialize;

/// Intermediate representation for a single `{ ... }` object literal.
pub(super) struct JsObjectBuilder {
    pub(super) fields: Vec<String>,
}

impl JsObjectBuilder {
    pub(super) fn new() -> Self {
        Self { fields: Vec::new() }
    }

    pub(super) fn try_field(
        mut self,
        name: &str,
        value: Result<String, String>,
    ) -> Result<Self, String> {
        self.fields.push(emit_field(name, value?));
        Ok(self)
    }

    pub(super) fn extend(mut self, more: Vec<String>) -> Self {
        self.fields.extend(more);
        self
    }

    pub(super) fn build(self) -> String {
        emit_object(self.fields)
    }
}

pub(super) fn to_js_literal<T: Serialize + ?Sized>(value: &T) -> Result<String, String> {
    serde_json::to_string(value)
        .map_err(|error| format!("Failed to serialize artifact value: {error}"))
}

pub(super) fn emit_object(fields: Vec<String>) -> String {
    let mut s = String::from("{\n");
    for (i, f) in fields.iter().enumerate() {
        if i > 0 {
            s.push_str(",\n");
        }
        s.push_str(f);
    }
    s.push_str("\n}");
    s
}

pub(super) fn emit_array(items: Vec<String>) -> String {
    if items.is_empty() {
        return "[]".to_string();
    }
    let mut s = String::from("[\n");
    for (i, item) in items.iter().enumerate() {
        if i > 0 {
            s.push_str(",\n");
        }
        s.push_str(item);
    }
    s.push_str("\n]");
    s
}

pub(super) fn emit_field(name: &str, value: String) -> String {
    let value = if value.contains('\n') {
        indent_block(&value, 2)
    } else {
        value
    };

    let mut s = String::new();
    write!(&mut s, "  {name}: {value}").expect("write to String");
    s
}

pub(super) fn indent_block(value: &str, spaces: usize) -> String {
    let indent = " ".repeat(spaces);
    let mut s =
        String::with_capacity(value.len() + value.lines().count().saturating_mul(spaces + 1));
    for line in value.lines() {
        s.push_str(&indent);
        s.push_str(line);
        s.push('\n');
    }
    if !s.is_empty() {
        s.pop();
    }
    s
}
