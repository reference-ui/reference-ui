//! Upstream definition merge for `extends` design-system composition.
//! `from_specs` resolves a named spec graph depth-first, failing closed on unknown
//! systems and circular chains, then merges evaluated specs upstream-first with
//! downstream precedence and lowers the composition once. `_private` token trees are
//! stripped at each boundary while upstream global CSS stays in its own stylesheet,
//! and every spec envelope is validated before it joins the merge.

use std::hash::Hash;

use indexmap::IndexMap;

use crate::spec::{check_envelope, EvaluatedSystemSpec, FromJsonError, TokenSpecNode};
use crate::{BaseSystem, FontDefinition};

impl BaseSystem {
    /// Resolve the extends graph rooted at `root` and lower the merged system.
    /// Later upstreams win over earlier ones and the root wins over all of them;
    /// diamonds share one resolution while circular chains and unknown names fail closed.
    pub fn from_specs(
        root: &str,
        systems: &IndexMap<String, EvaluatedSystemSpec>,
    ) -> Result<BaseSystem, FromJsonError> {
        let merged = ResolveContext::new(systems).resolve(root)?;
        BaseSystem::from_spec(&merged)
    }
}

/// Merge one upstream spec beneath a downstream spec. The downstream side wins
/// every shared leaf, map entry, and override; upstream `_private` token trees
/// and upstream global CSS never cross the boundary.
fn merge_two(upstream: &EvaluatedSystemSpec, local: &EvaluatedSystemSpec) -> EvaluatedSystemSpec {
    let stripped = strip_private_tokens(&upstream.tokens);
    let mut tokens = merge_token_groups(&stripped, &local.tokens);
    let mut fonts = overlay_maps(&upstream.fonts, &local.fonts);
    reconcile_font_token_dual_source(&mut tokens, &mut fonts, local);
    EvaluatedSystemSpec {
        schema_version: local.schema_version,
        profile: local.profile.clone(),
        name: local.name.clone(),
        extends: Vec::new(),
        tokens,
        fonts,
        breakpoints: overlay_optional(&upstream.breakpoints, &local.breakpoints),
        conditions: overlay_optional(&upstream.conditions, &local.conditions),
        global_css: local.global_css.clone(),
        keyframes: overlay_maps(&upstream.keyframes, &local.keyframes),
        recipes: overlay_maps(&upstream.recipes, &local.recipes),
        static_css: overlay_maps(&upstream.static_css, &local.static_css),
        provenance: upstream
            .provenance
            .iter()
            .chain(local.provenance.iter())
            .cloned()
            .collect(),
    }
}

/// Deep-merge token trees: groups recurse key by key while a downstream leaf or
/// scalar replaces the whole upstream node, so overrides never collide.
fn merge_token_groups(
    upstream: &IndexMap<String, TokenSpecNode>,
    local: &IndexMap<String, TokenSpecNode>,
) -> IndexMap<String, TokenSpecNode> {
    let mut merged = upstream.clone();
    for (key, local_node) in local {
        let node = match merged.get(key) {
            Some(upstream_node) => merge_token_nodes(upstream_node, local_node),
            None => local_node.clone(),
        };
        merged.insert(key.clone(), node);
    }
    merged
}

fn merge_token_nodes(upstream: &TokenSpecNode, local: &TokenSpecNode) -> TokenSpecNode {
    match (upstream, local) {
        (TokenSpecNode::Group(upstream), TokenSpecNode::Group(local)) => {
            TokenSpecNode::Group(merge_token_groups(upstream, local))
        }
        (_, local) => local.clone(),
    }
}

/// Prune `_private` subtrees at any depth, including a top-level category.
fn strip_private_tokens(
    tokens: &IndexMap<String, TokenSpecNode>,
) -> IndexMap<String, TokenSpecNode> {
    tokens
        .iter()
        .filter(|(category, _)| category.as_str() != "_private")
        .map(|(category, node)| (category.clone(), strip_private_node(node)))
        .collect()
}

fn strip_private_node(node: &TokenSpecNode) -> TokenSpecNode {
    match node {
        TokenSpecNode::Group(children) => TokenSpecNode::Group(
            children
                .iter()
                .filter(|(key, _)| key.as_str() != "_private")
                .map(|(key, child)| (key.clone(), strip_private_node(child)))
                .collect(),
        ),
        leaf => leaf.clone(),
    }
}

/// Resolve the `fonts` dual-source namespace across the boundary: a downstream
/// font evicts an upstream raw `fonts.*` token leaf and vice versa, so the
/// merged spec never carries both spellings of one name.
fn reconcile_font_token_dual_source(
    tokens: &mut IndexMap<String, TokenSpecNode>,
    fonts: &mut IndexMap<String, FontDefinition>,
    local: &EvaluatedSystemSpec,
) {
    let local_leaves = font_token_leaf_names(&local.tokens);
    for name in local.fonts.keys() {
        if !local_leaves.iter().any(|leaf| leaf == name) {
            remove_font_token_leaf(tokens, name);
        }
    }
    for name in local_leaves {
        if !local.fonts.contains_key(&name) {
            fonts.shift_remove(&name);
        }
    }
}

/// Names with a downstream raw token leaf under the `fonts` category.
fn font_token_leaf_names(tokens: &IndexMap<String, TokenSpecNode>) -> Vec<String> {
    match tokens.get("fonts") {
        Some(TokenSpecNode::Group(children)) => children
            .iter()
            .filter(|(_, node)| matches!(node, TokenSpecNode::Leaf(_)))
            .map(|(name, _)| name.clone())
            .collect(),
        Some(_) | None => Vec::new(),
    }
}

/// Drop an adopted raw token leaf under the `fonts` category, if present.
fn remove_font_token_leaf(tokens: &mut IndexMap<String, TokenSpecNode>, name: &str) {
    if let Some(TokenSpecNode::Group(children)) = tokens.get_mut("fonts") {
        if matches!(children.get(name), Some(TokenSpecNode::Leaf(_))) {
            children.shift_remove(name);
        }
    }
}

/// Overlay one authored map over another with the downstream side winning.
fn overlay_maps<K: Clone + Eq + Hash, V: Clone>(
    upstream: &IndexMap<K, V>,
    local: &IndexMap<K, V>,
) -> IndexMap<K, V> {
    let mut merged = upstream.clone();
    merged.extend(
        local
            .iter()
            .map(|(key, value)| (key.clone(), value.clone())),
    );
    merged
}

/// Overlay optional authored maps, preserving absence when neither side declares one.
fn overlay_optional<K: Clone + Eq + Hash, V: Clone>(
    upstream: &Option<IndexMap<K, V>>,
    local: &Option<IndexMap<K, V>>,
) -> Option<IndexMap<K, V>> {
    match (upstream, local) {
        (None, None) => None,
        (Some(upstream), None) => Some(upstream.clone()),
        (None, Some(local)) => Some(local.clone()),
        (Some(upstream), Some(local)) => Some(overlay_maps(upstream, local)),
    }
}

/// Depth-first extends resolver with memoization and a visiting stack.
struct ResolveContext<'a> {
    systems: &'a IndexMap<String, EvaluatedSystemSpec>,
    memo: IndexMap<String, EvaluatedSystemSpec>,
    visiting: Vec<String>,
}

impl<'a> ResolveContext<'a> {
    fn new(systems: &'a IndexMap<String, EvaluatedSystemSpec>) -> Self {
        Self {
            systems,
            memo: IndexMap::new(),
            visiting: Vec::new(),
        }
    }

    fn resolve(&mut self, name: &str) -> Result<EvaluatedSystemSpec, FromJsonError> {
        if let Some(done) = self.memo.get(name) {
            return Ok(done.clone());
        }
        if self.visiting.iter().any(|past| past.as_str() == name) {
            return Err(self.cycle_error(name));
        }
        let spec = lookup(self.systems, name)?;
        check_envelope(spec)?;
        self.visiting.push(name.to_string());
        let merged = self.resolve_spec(spec);
        self.visiting.pop();
        let merged = merged?;
        self.memo.insert(name.to_string(), merged.clone());
        Ok(merged)
    }

    fn resolve_spec(
        &mut self,
        spec: &'a EvaluatedSystemSpec,
    ) -> Result<EvaluatedSystemSpec, FromJsonError> {
        let mut adopted: Option<EvaluatedSystemSpec> = None;
        for dependency in &spec.extends {
            adopted = Some(self.adopt_dependency(adopted, dependency)?);
        }
        Ok(merge_with_local(adopted, spec))
    }

    fn adopt_dependency(
        &mut self,
        adopted: Option<EvaluatedSystemSpec>,
        dependency: &str,
    ) -> Result<EvaluatedSystemSpec, FromJsonError> {
        let upstream = self.resolve(dependency)?;
        Ok(match adopted {
            None => upstream,
            Some(prior) => merge_two(&prior, &upstream),
        })
    }

    fn cycle_error(&self, name: &str) -> FromJsonError {
        let mut chain = self.visiting.clone();
        chain.push(name.to_string());
        FromJsonError::ExtendsCycle { chain }
    }
}

fn merge_with_local(
    adopted: Option<EvaluatedSystemSpec>,
    spec: &EvaluatedSystemSpec,
) -> EvaluatedSystemSpec {
    match adopted {
        None => spec.clone(),
        Some(prior) => merge_two(&prior, spec),
    }
}

fn lookup<'a>(
    systems: &'a IndexMap<String, EvaluatedSystemSpec>,
    name: &str,
) -> Result<&'a EvaluatedSystemSpec, FromJsonError> {
    systems
        .get(name)
        .ok_or_else(|| FromJsonError::UnknownUpstream {
            name: name.to_string(),
        })
}

#[cfg(test)]
mod adoption_tests;
#[cfg(test)]
mod parts;
#[cfg(test)]
mod tests;
