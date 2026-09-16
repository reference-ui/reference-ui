//! Lowers an `EvaluatedSystemSpec` into an indexed `BaseSystem`.
//! Validates schemaVersion and profile, applies profile canonical conditions and standard
//! breakpoints, and overlays explicit authored entries deterministically.
//! Token categories are walked, light/dark slots normalized, custom properties kebabed,
//! and cyclic token references detected while carrying provenance source on diagnostics.
//! Global CSS fragments are validated against macro constraints and preserved as structured IR.

use std::collections::HashSet;

use indexmap::IndexMap;

use crate::spec::{
    EvaluatedSystemSpec, FromJsonError, ProvenanceEntry, ProvenanceKind, TokenSpecLeaf,
    TokenSpecNode,
};
use crate::tokens::{css_custom_property, TokenDictionary, TokenEntry};
use crate::{BaseSystem, BreakpointScale, FontDefinition, FontScale};

/// Parse an evaluated JSON spec and index it.
pub(crate) fn from_json(json: &str) -> Result<BaseSystem, FromJsonError> {
    lower(EvaluatedSystemSpec::from_json(json)?)
}

/// Lower a pre-parsed evaluated spec into an indexed BaseSystem.
pub(crate) fn from_spec(spec: &EvaluatedSystemSpec) -> Result<BaseSystem, FromJsonError> {
    lower(spec.clone())
}

fn lower(spec: EvaluatedSystemSpec) -> Result<BaseSystem, FromJsonError> {
    if spec.schema_version != 1 {
        return Err(FromJsonError::UnsupportedSchemaVersion(spec.schema_version));
    }
    if spec.profile != "reference-ui" {
        return Err(FromJsonError::UnsupportedProfile(spec.profile));
    }
    for fragment in &spec.global_css {
        crate::global_css::validate_fragment(fragment)?;
    }
    let mut ctx = LoweringContext::new(&spec.provenance);
    ctx.index_tokens(&spec.tokens)?;
    ctx.detect_alias_cycles()?;
    ctx.index_font_tokens(&spec.fonts)?;
    let conditions = lower_conditions(spec.conditions);
    Ok(BaseSystem {
        name: spec.name,
        tokens: TokenDictionary::from_entries(ctx.tokens),
        fonts: FontScale::from_definitions(spec.fonts),
        breakpoints: BreakpointScale::from_profile_and_authored(spec.breakpoints),
        conditions: conditions.into(),
        global_css: spec.global_css,
        keyframes: spec.keyframes,
        recipes: spec.recipes,
        static_css: spec.static_css,
    })
}

fn lower_conditions(authored: Option<IndexMap<String, String>>) -> IndexMap<String, String> {
    let mut conditions = crate::conditions::lib_conditions();
    if let Some(authored_map) = authored {
        for (key, wrap) in authored_map {
            if let Some(stripped) = key.strip_prefix('_') {
                conditions.shift_remove(stripped);
            } else {
                conditions.shift_remove(&format!("_{key}"));
            }
            conditions.insert(key, wrap);
        }
    }
    conditions
}

struct LoweringContext<'a> {
    tokens: IndexMap<String, TokenEntry>,
    provenance: &'a [ProvenanceEntry],
}

impl<'a> LoweringContext<'a> {
    fn new(provenance: &'a [ProvenanceEntry]) -> Self {
        Self {
            tokens: IndexMap::new(),
            provenance,
        }
    }

    fn find_source(&self, kind: ProvenanceKind, key: &str) -> Option<String> {
        for entry in self.provenance {
            if entry.kind == kind && entry.keys.iter().any(|k| k == key || key.starts_with(k)) {
                return Some(entry.source.clone());
            }
        }
        None
    }

    fn index_tokens(
        &mut self,
        tokens: &IndexMap<String, TokenSpecNode>,
    ) -> Result<(), FromJsonError> {
        for (category, node) in tokens {
            self.walk(category, "", node)?;
        }
        Ok(())
    }

    fn walk(
        &mut self,
        category: &str,
        path: &str,
        node: &TokenSpecNode,
    ) -> Result<(), FromJsonError> {
        match node {
            TokenSpecNode::Scalar => {
                let key = full_path(category, path);
                let source = self.find_source(ProvenanceKind::Tokens, &key);
                Err(FromJsonError::InvalidLeaf { path: key, source })
            }
            TokenSpecNode::Leaf(leaf) => self.insert_resolved(category, path, leaf),
            TokenSpecNode::Group(children) => {
                for (segment, child) in children {
                    let child_path = join_path(path, segment);
                    self.walk(category, &child_path, child)?;
                }
                Ok(())
            }
        }
    }

    fn insert_resolved(
        &mut self,
        category: &str,
        path: &str,
        leaf: &TokenSpecLeaf,
    ) -> Result<(), FromJsonError> {
        let key = full_path(category, path);
        let source = self.find_source(ProvenanceKind::Tokens, &key);
        let (light, dark) = resolve_modes(&key, leaf, source.as_deref())?;
        if self.tokens.contains_key(&key) {
            return Err(FromJsonError::DuplicatePath { path: key, source });
        }
        self.tokens.insert(
            key,
            TokenEntry::new(
                category.to_string(),
                css_custom_property(category, path),
                light,
                dark,
            ),
        );
        Ok(())
    }

    fn index_font_tokens(
        &mut self,
        fonts: &IndexMap<String, FontDefinition>,
    ) -> Result<(), FromJsonError> {
        for (name, def) in fonts {
            let key = format!("fonts.{name}");
            if self.tokens.contains_key(&key) {
                let source = self.find_source(ProvenanceKind::Fonts, name);
                return Err(FromJsonError::DuplicatePath { path: key, source });
            }
            self.tokens.insert(
                key,
                TokenEntry::new(
                    "fonts".to_string(),
                    css_custom_property("fonts", name),
                    def.value.clone(),
                    None,
                ),
            );
        }
        Ok(())
    }

    fn detect_alias_cycles(&self) -> Result<(), FromJsonError> {
        let graph = self.alias_graph();
        let mut walk = CycleWalk {
            graph: &graph,
            visiting: HashSet::new(),
            visited: HashSet::new(),
        };
        for key in self.tokens.keys() {
            if let Err(path) = walk.visit(key) {
                let source = self.find_source(ProvenanceKind::Tokens, &path);
                return Err(FromJsonError::Cycle { path, source });
            }
        }
        Ok(())
    }

    fn alias_graph(&self) -> IndexMap<String, Vec<String>> {
        let mut graph = IndexMap::new();
        for (key, entry) in &self.tokens {
            push_alias(&mut graph, key, entry.light(), &self.tokens);
            if let Some(dark) = entry.dark() {
                push_alias(&mut graph, key, dark, &self.tokens);
            }
        }
        graph
    }
}

struct CycleWalk<'a> {
    graph: &'a IndexMap<String, Vec<String>>,
    visiting: HashSet<String>,
    visited: HashSet<String>,
}

impl CycleWalk<'_> {
    fn visit(&mut self, key: &str) -> Result<(), String> {
        if self.visited.contains(key) {
            return Ok(());
        }
        if self.visiting.contains(key) {
            return Err(key.to_string());
        }
        self.visiting.insert(key.to_string());
        let edges = self.graph.get(key).cloned().unwrap_or_default();
        for next in edges {
            self.visit(&next)?;
        }
        self.visiting.remove(key);
        self.visited.insert(key.to_string());
        Ok(())
    }
}

fn push_alias(
    graph: &mut IndexMap<String, Vec<String>>,
    from: &str,
    value: &str,
    tokens: &IndexMap<String, TokenEntry>,
) {
    let Some(target) = alias_target(value) else {
        return;
    };
    if tokens.contains_key(target) {
        graph
            .entry(from.to_string())
            .or_default()
            .push(target.to_string());
    }
}

fn alias_target(value: &str) -> Option<&str> {
    let inner = value.trim().strip_prefix('{')?.strip_suffix('}')?.trim();
    if inner.is_empty() {
        return None;
    }
    let ok = inner
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '.' | '_' | '-'));
    ok.then_some(inner)
}

fn resolve_modes(
    path: &str,
    leaf: &TokenSpecLeaf,
    source: Option<&str>,
) -> Result<(String, Option<String>), FromJsonError> {
    pair_from_slots(&leaf.value, &leaf.light, &leaf.dark).ok_or_else(|| {
        FromJsonError::InvalidLeaf {
            path: path.to_string(),
            source: source.map(str::to_string),
        }
    })
}

fn pair_from_slots(
    value: &Option<String>,
    light: &Option<String>,
    dark: &Option<String>,
) -> Option<(String, Option<String>)> {
    if let (Some(light), Some(dark)) = (light, dark) {
        return Some((light.clone(), Some(dark.clone())));
    }
    if let (Some(value), Some(light)) = (value, light) {
        return Some((light.clone(), Some(value.clone())));
    }
    if let (Some(value), Some(dark)) = (value, dark) {
        return Some((value.clone(), Some(dark.clone())));
    }
    let single = value.as_ref().or(light.as_ref()).or(dark.as_ref())?;
    Some((single.clone(), None))
}

fn join_path(parent: &str, segment: &str) -> String {
    if parent.is_empty() {
        segment.to_string()
    } else {
        format!("{parent}.{segment}")
    }
}

fn full_path(category: &str, path: &str) -> String {
    if path.is_empty() {
        category.to_string()
    } else {
        format!("{category}.{path}")
    }
}

#[cfg(test)]
mod tests;
