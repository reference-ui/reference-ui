//! Test-only builders for extends specs and resolution graphs.
//! `Parts` assembles evaluated-spec JSON with declared `extends` edges, and the
//! helpers below load parts into named graphs resolved by `BaseSystem::from_specs`.

use indexmap::IndexMap;

use crate::spec::EvaluatedSystemSpec;
use crate::BaseSystem;

pub(super) struct Parts<'a> {
    pub(super) name: &'a str,
    pub(super) extends: &'a [&'a str],
    pub(super) tokens: &'a str,
    pub(super) fonts: &'a str,
    pub(super) keyframes: &'a str,
    pub(super) recipes: &'a str,
    pub(super) global_css: &'a str,
    pub(super) conditions: Option<&'a str>,
    pub(super) breakpoints: Option<&'a str>,
    pub(super) static_css: &'a str,
}

pub(super) fn parts(name: &str) -> Parts<'_> {
    Parts {
        name,
        extends: &[],
        tokens: "{}",
        fonts: "{}",
        keyframes: "{}",
        recipes: "{}",
        global_css: "[]",
        conditions: None,
        breakpoints: None,
        static_css: "{}",
    }
}

fn spec_json(part: &Parts<'_>) -> String {
    let extends = part
        .extends
        .iter()
        .map(|name| format!("\"{name}\""))
        .collect::<Vec<_>>()
        .join(",");
    let conditions = optional_field("conditions", part.conditions);
    let breakpoints = optional_field("breakpoints", part.breakpoints);
    format!(
        "{{\"schemaVersion\":1,\"profile\":\"reference-ui\",\"name\":\"{}\",\"extends\":[{extends}],{conditions}{breakpoints}\"tokens\":{},\"fonts\":{},\"globalCss\":{},\"keyframes\":{},\"recipes\":{},\"staticCss\":{},\"provenance\":[]}}",
        part.name,
        part.tokens,
        part.fonts,
        part.global_css,
        part.keyframes,
        part.recipes,
        part.static_css,
        extends = extends,
        conditions = conditions,
        breakpoints = breakpoints
    )
}

fn optional_field(key: &str, value: Option<&str>) -> String {
    value.map_or_else(String::new, |body| format!("\"{key}\":{body},"))
}

pub(super) fn load(part: Parts<'_>) -> (String, EvaluatedSystemSpec) {
    let spec = EvaluatedSystemSpec::from_json(&spec_json(&part)).unwrap();
    (part.name.to_string(), spec)
}

pub(super) fn insert_spec(into: &mut IndexMap<String, EvaluatedSystemSpec>, part: Parts<'_>) {
    let (name, spec) = load(part);
    into.insert(name, spec);
}

pub(super) fn resolve(root: &str, systems: &IndexMap<String, EvaluatedSystemSpec>) -> BaseSystem {
    BaseSystem::from_specs(root, systems).unwrap()
}
