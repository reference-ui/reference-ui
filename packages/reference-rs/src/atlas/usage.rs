use crate::atlas::internal::{JsxAttribute, JsxOccurrence, ModuleInfo, UsageState};
use crate::atlas::model::{Component, Usage};
use crate::atlas::resolver::{build_alias_map, resolve_occurrence_key};
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::PathBuf;

pub fn collect_usage_for_module(
    module: &ModuleInfo,
    modules: &HashMap<PathBuf, ModuleInfo>,
    state_snapshot: &BTreeMap<String, UsageState>,
    states: &mut BTreeMap<String, UsageState>,
) {
    let alias_map = build_alias_map(module, modules, state_snapshot);
    let namespace_map = module.namespace_imports.clone();
    let mut seen_in_file = BTreeSet::new();

    for occurrence in find_jsx_occurrences(&module.content) {
        let Some(key) = resolve_occurrence_key(&occurrence.tag_name, &alias_map, &namespace_map, state_snapshot) else {
            continue;
        };

        let Some(state) = states.get_mut(&key) else {
            continue;
        };

        state.component.count += 1;
        if state.example_set.insert(occurrence.snippet.clone()) && state.component.examples.len() < 5 {
            state.component.examples.push(occurrence.snippet.clone());
        }
        seen_in_file.insert(key.clone());

        let mut explicit_names = BTreeSet::new();
        for attribute in occurrence.attributes {
            explicit_names.insert(attribute.name.clone());
            if let Some(prop) = state.component.props.iter_mut().find(|prop| prop.name == attribute.name) {
                prop.count += 1;
            }
            if let Some(value) = attribute.literal_value {
                state
                    .prop_value_counts
                    .entry(attribute.name)
                    .or_default()
                    .entry(value)
                    .and_modify(|count| *count += 1)
                    .or_insert(1);
            }
        }

        if occurrence.has_children && !explicit_names.contains("children") {
            if let Some(prop) = state.component.props.iter_mut().find(|prop| prop.name == "children") {
                prop.count += 1;
            }
        }
    }

    for key in &seen_in_file {
        if let Some(state) = states.get_mut(key) {
            state.file_presence_count += 1;
        }
    }

    let seen_keys = seen_in_file.into_iter().collect::<Vec<_>>();
    for left_key in &seen_keys {
        let other_names = seen_keys
            .iter()
            .filter(|right_key| *right_key != left_key)
            .filter_map(|right_key| state_snapshot.get(right_key).map(|state| state.component.name.clone()))
            .collect::<Vec<_>>();
        if let Some(state) = states.get_mut(left_key) {
            for other_name in other_names {
                state
                    .used_with_counts
                    .entry(other_name)
                    .and_modify(|count| *count += 1)
                    .or_insert(1);
            }
        }
    }
}

pub fn finalize_components(states: BTreeMap<String, UsageState>) -> Vec<Component> {
    let total_count = states.values().map(|state| state.component.count).sum::<u32>();
    let mut components = Vec::new();

    for (_, mut state) in states {
        state.component.usage = Usage::from_count(state.component.count, total_count);

        for prop in &mut state.component.props {
            prop.usage = Usage::from_count(prop.count, state.component.count);

            let mut values = BTreeMap::new();
            if let Some(allowed) = state.prop_allowed_values.get(&prop.name) {
                for value in allowed {
                    let count = state
                        .prop_value_counts
                        .get(&prop.name)
                        .and_then(|counts| counts.get(value))
                        .copied()
                        .unwrap_or(0);
                    values.insert(value.clone(), Usage::from_count(count, prop.count));
                }
            }

            if let Some(observed) = state.prop_value_counts.get(&prop.name) {
                for (value, count) in observed {
                    values.insert(value.clone(), Usage::from_count(*count, prop.count));
                }
            }

            prop.values = (!values.is_empty()).then_some(values);
        }

        state.component.props.sort_by(|left, right| left.name.cmp(&right.name));
        state.component.used_with = state
            .used_with_counts
            .into_iter()
            .map(|(name, count)| (name, Usage::from_count(count, state.file_presence_count)))
            .collect();
        components.push(state.component);
    }

    components.sort_by(|left, right| left.name.cmp(&right.name).then(left.source.cmp(&right.source)));
    components
}

fn find_jsx_occurrences(content: &str) -> Vec<JsxOccurrence> {
    let bytes = content.as_bytes();
    let mut index = 0usize;
    let mut occurrences = Vec::new();

    while index < bytes.len() {
        if bytes[index] != b'<' || index + 1 >= bytes.len() {
            index += 1;
            continue;
        }
        if bytes[index + 1] == b'/' || !is_tag_start(bytes[index + 1] as char) {
            index += 1;
            continue;
        }

        let Some((tag_name, open_end, self_closing, attributes)) = parse_opening_tag(content, index) else {
            index += 1;
            continue;
        };

        if self_closing {
            occurrences.push(JsxOccurrence {
                tag_name,
                snippet: content[index..open_end].to_string(),
                attributes,
                has_children: false,
            });
            index = open_end;
            continue;
        }

        let Some(close_start) = find_matching_close_tag(content, &tag_name, open_end) else {
            index = open_end;
            continue;
        };
        let close_end = close_start + format!("</{tag_name}>").len();
        let snippet = content[index..close_end].to_string();
        let inner = &content[open_end..close_start];
        occurrences.push(JsxOccurrence {
            tag_name,
            snippet,
            attributes,
            has_children: !inner.trim().is_empty(),
        });
        index = open_end;
    }

    occurrences
}

fn is_tag_start(ch: char) -> bool {
    ch.is_ascii_uppercase()
}

fn parse_opening_tag(content: &str, start: usize) -> Option<(String, usize, bool, Vec<JsxAttribute>)> {
    let bytes = content.as_bytes();
    let mut index = start + 1;
    while index < bytes.len() && is_tag_name_char(bytes[index] as char) {
        index += 1;
    }
    let tag_name = content[start + 1..index].to_string();

    let mut brace_depth = 0usize;
    let mut quote: Option<u8> = None;
    let mut cursor = index;
    while cursor < bytes.len() {
        let ch = bytes[cursor];
        if let Some(active) = quote {
            if ch == active {
                quote = None;
            }
            cursor += 1;
            continue;
        }
        match ch {
            b'\'' | b'"' => quote = Some(ch),
            b'{' => brace_depth += 1,
            b'}' => brace_depth = brace_depth.saturating_sub(1),
            b'>' if brace_depth == 0 => {
                let attr_source = &content[index..cursor];
                let self_closing = attr_source.trim_end().ends_with('/');
                return Some((tag_name, cursor + 1, self_closing, parse_attributes(attr_source)));
            }
            _ => {}
        }
        cursor += 1;
    }
    None
}

fn is_tag_name_char(ch: char) -> bool {
    ch.is_ascii_alphanumeric() || ch == '_' || ch == '.'
}

fn parse_attributes(source: &str) -> Vec<JsxAttribute> {
    let bytes = source.as_bytes();
    let mut cursor = 0usize;
    let mut attrs = Vec::new();

    while cursor < bytes.len() {
        while cursor < bytes.len() && bytes[cursor].is_ascii_whitespace() {
            cursor += 1;
        }
        if cursor >= bytes.len() || bytes[cursor] == b'/' {
            break;
        }
        if bytes[cursor] == b'{' {
            if let Some(end) = consume_balanced(source, cursor, b'{', b'}') {
                cursor = end;
            } else {
                break;
            }
            continue;
        }

        let name_start = cursor;
        while cursor < bytes.len() && is_attr_name_char(bytes[cursor] as char) {
            cursor += 1;
        }
        if name_start == cursor {
            cursor += 1;
            continue;
        }
        let name = source[name_start..cursor].trim().to_string();

        while cursor < bytes.len() && bytes[cursor].is_ascii_whitespace() {
            cursor += 1;
        }

        if cursor < bytes.len() && bytes[cursor] == b'=' {
            cursor += 1;
            while cursor < bytes.len() && bytes[cursor].is_ascii_whitespace() {
                cursor += 1;
            }
            let literal_value = if cursor < bytes.len() && (bytes[cursor] == b'\'' || bytes[cursor] == b'"') {
                let quote = bytes[cursor];
                let value_start = cursor + 1;
                cursor += 1;
                while cursor < bytes.len() && bytes[cursor] != quote {
                    cursor += 1;
                }
                let value = source[value_start..cursor].to_string();
                if cursor < bytes.len() {
                    cursor += 1;
                }
                Some(value)
            } else if cursor < bytes.len() && bytes[cursor] == b'{' {
                let end = consume_balanced(source, cursor, b'{', b'}').unwrap_or(bytes.len());
                let expression = source[cursor + 1..end.saturating_sub(1)].trim();
                cursor = end;
                parse_expression_literal(expression)
            } else {
                None
            };
            attrs.push(JsxAttribute { name, literal_value });
        } else {
            attrs.push(JsxAttribute {
                name,
                literal_value: Some("true".to_string()),
            });
        }
    }

    attrs
}

fn is_attr_name_char(ch: char) -> bool {
    ch.is_ascii_alphanumeric() || ch == '_' || ch == '-'
}

fn consume_balanced(source: &str, start: usize, open: u8, close: u8) -> Option<usize> {
    let bytes = source.as_bytes();
    let mut cursor = start;
    let mut depth = 0usize;
    let mut quote: Option<u8> = None;
    while cursor < bytes.len() {
        let ch = bytes[cursor];
        if let Some(active) = quote {
            if ch == active {
                quote = None;
            }
            cursor += 1;
            continue;
        }
        match ch {
            b'\'' | b'"' => quote = Some(ch),
            _ if ch == open => depth += 1,
            _ if ch == close => {
                depth = depth.saturating_sub(1);
                if depth == 0 {
                    return Some(cursor + 1);
                }
            }
            _ => {}
        }
        cursor += 1;
    }
    None
}

fn parse_expression_literal(expression: &str) -> Option<String> {
    if expression == "true" || expression == "false" {
        return Some(expression.to_string());
    }
    if expression.parse::<i64>().is_ok() || expression.parse::<f64>().is_ok() {
        return Some(expression.to_string());
    }
    if expression.starts_with('"') && expression.ends_with('"') && expression.len() >= 2 {
        return Some(expression[1..expression.len() - 1].to_string());
    }
    if expression.starts_with('\'') && expression.ends_with('\'') && expression.len() >= 2 {
        return Some(expression[1..expression.len() - 1].to_string());
    }
    None
}

fn find_matching_close_tag(content: &str, tag_name: &str, start: usize) -> Option<usize> {
    let open_pattern = format!("<{tag_name}");
    let close_pattern = format!("</{tag_name}>");
    let mut cursor = start;
    let mut depth = 1usize;

    while cursor < content.len() {
        let next_open = content[cursor..].find(&open_pattern).map(|offset| cursor + offset);
        let next_close = content[cursor..].find(&close_pattern).map(|offset| cursor + offset);
        match (next_open, next_close) {
            (_, Some(close_start)) if next_open.map(|open_start| close_start < open_start).unwrap_or(true) => {
                depth -= 1;
                if depth == 0 {
                    return Some(close_start);
                }
                cursor = close_start + close_pattern.len();
            }
            (Some(open_start), _) => {
                depth += 1;
                cursor = open_start + open_pattern.len();
            }
            _ => break,
        }
    }

    None
}