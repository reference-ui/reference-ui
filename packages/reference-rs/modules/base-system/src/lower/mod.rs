//! Lower a nested `BaseSystemDump` into today's indexed `BaseSystem`.
//! Walks open token categories, resolves the seven-case light/dark table, kebabs only the
//! category when computing `cssVar`, and keeps brace aliases verbatim while failing closed on
//! cycles among keys that exist. Font families become `fonts.{name}` tokens unless the dump
//! already declared that path. Duplicates error; `insert_leaf` is not used.

use crate::dump::{
    BaseSystemDump, DumpBreakpointWidth, FromJsonError, TokenDumpLeaf, TokenDumpNode,
};
use crate::tokens::{css_custom_property, TokenDictionary, TokenEntry};
use crate::{BaseSystem, BreakpointScale, FontDefinition, FontScale};
use indexmap::IndexMap;
use std::collections::HashSet;

/// Parse an evaluated JSON dump and index it.
pub(crate) fn from_json(json: &str) -> Result<BaseSystem, FromJsonError> {
    lower(BaseSystemDump::from_json(json)?)
}

fn lower(dump: BaseSystemDump) -> Result<BaseSystem, FromJsonError> {
    let mut ctx = LoweringContext::default();
    ctx.index_tokens(&dump.tokens)?;
    ctx.detect_alias_cycles()?;
    ctx.index_font_tokens(&dump.fonts)?;
    Ok(BaseSystem {
        name: dump.name,
        tokens: TokenDictionary::from_entries(ctx.tokens),
        fonts: FontScale::from_definitions(dump.fonts),
        breakpoints: lower_breakpoints(dump.breakpoints),
        conditions: dump.conditions.into(),
        global_css: dump.global_css,
        keyframes: dump.keyframes,
        recipes: dump.recipes,
        static_css: dump.static_css,
    })
}

#[derive(Default)]
struct LoweringContext {
    tokens: IndexMap<String, TokenEntry>,
}

impl LoweringContext {
    fn index_tokens(
        &mut self,
        tokens: &IndexMap<String, TokenDumpNode>,
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
        node: &TokenDumpNode,
    ) -> Result<(), FromJsonError> {
        match node {
            TokenDumpNode::Scalar => Err(FromJsonError::InvalidLeaf {
                path: full_path(category, path),
            }),
            TokenDumpNode::Leaf(leaf) => self.insert_resolved(category, path, leaf),
            TokenDumpNode::Group(children) => {
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
        leaf: &TokenDumpLeaf,
    ) -> Result<(), FromJsonError> {
        let key = full_path(category, path);
        let (light, dark) = resolve_modes(&key, leaf)?;
        if self.tokens.contains_key(&key) {
            return Err(FromJsonError::DuplicatePath { path: key });
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
                return Err(FromJsonError::DuplicatePath { path: key });
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
            walk.visit(key)?;
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
    fn visit(&mut self, key: &str) -> Result<(), FromJsonError> {
        if self.visited.contains(key) {
            return Ok(());
        }
        if self.visiting.contains(key) {
            return Err(FromJsonError::Cycle {
                path: key.to_string(),
            });
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
    leaf: &TokenDumpLeaf,
) -> Result<(String, Option<String>), FromJsonError> {
    pair_from_slots(&leaf.value, &leaf.light, &leaf.dark).ok_or_else(|| {
        FromJsonError::InvalidLeaf {
            path: path.to_string(),
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

fn lower_breakpoints(map: IndexMap<String, DumpBreakpointWidth>) -> BreakpointScale {
    BreakpointScale::from_named_widths(map.into_iter().map(|(name, width)| (name, width.into_px())))
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
