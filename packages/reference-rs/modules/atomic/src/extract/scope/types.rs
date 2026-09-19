//! Type-space bindings lowered to const objects: TS enums and param type literals.
//! An enum whose members carry string or numeric initializers folds member
//! reads (`Sizes.Small`) exactly like a const object; uninitialized members
//! drop that path, verbatim v2's fence. A function parameter annotated with
//! a `TSTypeLiteral` folds the same way (`props.color`), all-or-nothing:
//! one unfoldable member refuses the whole annotation, so a partial object
//! never answers `undefined` for a key the type left open. Destructured
//! params bind the members they select. These inits carry no runtime
//! provenance, so the stale-strip pass leaves them alone; a tracked write
//! to the name still poisons every use through the usual mutation check.

use oxc_ast::ast::{
    BindingPattern, Expression, FormalParameter, PropertyKey, TSEnumDeclaration, TSEnumMemberName,
    TSLiteral, TSSignature, TSType,
};
use oxc_span::Span;

use super::binding::BindingInit;
use super::lookup::{ImportLookup, ScopeChain, Scoped};
use super::table::{ScopeId, ScopeTable, ROOT_SCOPE};
use super::value::{self, peel};
use crate::atom::AtomValue;
use crate::extract::constants::{ConstObject, LocalConstants, ObjectProp};
use crate::extract::fold::{fold_binary, fold_template, fold_unary};

/// Lower a TS enum to the object its initialized members name (SPEC-V2-45).
///
/// String, numeric, and boolean initializers record directly; computed
/// inits fold resolver-independently through the landed nodes — binaries,
/// templates, and `+`/`-`/`!`/`~` unaries — verbatim v2's
/// `expression_to_literal(init, None)`. Uninitialized, member-reference,
/// and still-dynamic members drop that path, so the use site warns exactly
/// like a missing member.
pub fn enum_object(decl: &TSEnumDeclaration<'_>) -> ConstObject {
    // enum Sizes { Small = '4px', Auto }
    let table = ScopeTable::new();
    let bag = LocalConstants::default();
    let scoped = ScopeChain::new(&table, ImportLookup::ProjectBag(&bag)).at(ROOT_SCOPE);
    let mut entries = ConstObject::new();
    for member in &decl.body.members {
        let Some(name) = enum_member_name(&member.id) else {
            continue;
        };
        let Some(init) = member.initializer.as_ref() else {
            continue;
        };
        if let Some(leaf) = enum_member_leaf(init, scoped) {
            entries.insert(
                name,
                ObjectProp {
                    leaves: vec![leaf],
                    nested: ConstObject::new(),
                },
            );
        }
    }
    entries
}

/// One enum member's name, or None for exotic member names.
fn enum_member_name(id: &TSEnumMemberName<'_>) -> Option<String> {
    match id {
        TSEnumMemberName::Identifier(ident) => Some(ident.name.to_string()),
        TSEnumMemberName::String(lit) => Some(lit.value.to_string()),
        _ => None,
    }
}

/// One enum member's leaf: literals and computed folds, wrappers peeled.
fn enum_member_leaf(init: &Expression<'_>, scoped: Scoped<'_>) -> Option<AtomValue> {
    // Wrap = ('4px')  — transparent wrappers peel before matching
    let peeled = peel(init);
    if let Some(leaf) = enum_literal_leaf(peeled) {
        return Some(leaf);
    }
    match peeled {
        Expression::BinaryExpression(bin) => enum_binary_leaf(bin, scoped),
        Expression::TemplateLiteral(lit) => enum_template_leaf(lit, scoped),
        Expression::UnaryExpression(unary) => enum_unary_leaf(unary, scoped),
        _ => None,
    }
}

/// One literal enum member, or None for computed initializers.
fn enum_literal_leaf(init: &Expression<'_>) -> Option<AtomValue> {
    match init {
        Expression::StringLiteral(s) => Some(AtomValue::String(s.value.as_str().into())),
        Expression::NumericLiteral(n) => Some(AtomValue::Number(n.value.to_string().into())),
        Expression::BooleanLiteral(b) => Some(AtomValue::Bool(b.value)),
        _ => None,
    }
}

/// One binary enum member (`AB = 'a' + 'b'`), or None unless exactly one
/// clean leaf — a member is one binding.
fn enum_binary_leaf(
    bin: &oxc_ast::ast::BinaryExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<AtomValue> {
    let fold = fold_binary(bin.operator, &bin.left, &bin.right, scoped);
    if single_clean_binary(&fold) {
        return fold.values.into_iter().next();
    }
    None
}

/// One template enum member (`` Greet = `bl${'ue'}` ``), joined directly.
fn enum_template_leaf(
    lit: &oxc_ast::ast::TemplateLiteral<'_>,
    scoped: Scoped<'_>,
) -> Option<AtomValue> {
    let fold = fold_template(lit, scoped);
    if fold.values.len() == 1 && fold.refusals.is_empty() {
        return fold
            .values
            .into_iter()
            .next()
            .map(|joined| AtomValue::String(joined.into()));
    }
    None
}

/// One unary enum member (`Neg = -1`, `Flip = !0`, `Mask = ~1`), or None
/// unless exactly one clean leaf.
fn enum_unary_leaf(
    unary: &oxc_ast::ast::UnaryExpression<'_>,
    scoped: Scoped<'_>,
) -> Option<AtomValue> {
    let fold = fold_unary(unary.operator, &unary.argument, scoped);
    if single_clean_unary(&fold) {
        return fold.values.into_iter().next();
    }
    None
}

/// True for a binary fold carrying exactly one leaf and no residue.
fn single_clean_binary(fold: &crate::extract::fold::BinaryFold<'_, '_>) -> bool {
    fold.values.len() == 1
        && fold.refusals.is_empty()
        && fold.unary_refusals.is_empty()
        && fold.template_refusals.is_empty()
        && fold.dynamic.is_empty()
}

/// True for a unary fold carrying exactly one leaf and no residue.
fn single_clean_unary(fold: &crate::extract::fold::UnaryFold<'_, '_>) -> bool {
    fold.values.len() == 1
        && fold.refusals.is_empty()
        && fold.template_refusals.is_empty()
        && fold.dynamic.is_empty()
}

/// Fold a parameter's `TSTypeLiteral` annotation to its object (SPEC-V2-46).
///
/// All-or-nothing, verbatim v2: every member must be a required property
/// signature with a static or string key and a string, number, or boolean
/// literal type. Optional members, index signatures, unions, references,
/// and nested literals refuse the whole annotation.
pub fn param_type_object(param: &FormalParameter<'_>) -> Option<ConstObject> {
    // function paint(props: { color: 'red'; size: 4 })
    let annotation = param.type_annotation.as_ref()?;
    let TSType::TSTypeLiteral(type_lit) = &annotation.type_annotation else {
        return None;
    };
    let mut entries = ConstObject::new();
    for member in &type_lit.members {
        let TSSignature::TSPropertySignature(prop) = member else {
            return None;
        };
        if prop.optional {
            return None;
        }
        let Some(key) = annotation_key(&prop.key) else {
            return None;
        };
        let annotation = prop.type_annotation.as_ref()?;
        let leaf = ts_literal_leaf(&annotation.type_annotation)?;
        entries.insert(
            key,
            ObjectProp {
                leaves: vec![leaf],
                nested: ConstObject::new(),
            },
        );
    }
    Some(entries)
}

/// One annotation member's key, or None for computed and exotic keys.
fn annotation_key(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(ident) => Some(ident.name.to_string()),
        PropertyKey::StringLiteral(lit) => Some(lit.value.to_string()),
        _ => None,
    }
}

/// One annotation member's literal leaf, or None for non-literal types.
fn ts_literal_leaf(ts_type: &TSType<'_>) -> Option<AtomValue> {
    let TSType::TSLiteralType(lit_type) = ts_type else {
        return None;
    };
    match &lit_type.literal {
        TSLiteral::StringLiteral(s) => Some(AtomValue::String(s.value.as_str().into())),
        TSLiteral::NumericLiteral(n) => Some(AtomValue::Number(n.value.to_string().into())),
        TSLiteral::BooleanLiteral(b) => Some(AtomValue::Bool(b.value)),
        _ => None,
    }
}

/// One param-pattern bind session: the annotation plus scope lookup.
struct ParamBind<'t> {
    /// The folded annotation members selections read from.
    annotation: &'t ConstObject,
    /// Bindings recorded so far, for identifier defaults.
    table: &'t ScopeTable,
    /// The scope the pattern declares its names in.
    scope: ScopeId,
    /// Keys the pattern lists, excluded from the rest leftovers.
    listed: Vec<String>,
    /// True when an unresolvable key hides the exclusion set.
    blind: bool,
    /// Bound names: values where they fold, None where they shadow.
    bound: ShadowOut,
}

/// Bind a destructured parameter against its folded annotation (SPEC-V2-46).
///
/// Per-name leniency, verbatim v2's `resolve_pattern_path`: identifier and
/// rename selections carry the member's leaves, rest binds the unlisted
/// members as an object, and defaults fire only on missing keys — a
/// defaulted name over a present key folds from the source. Unresolvable
/// keys, nesting, and array patterns bind their names to shadow, never
/// refusing the whole parameter.
pub fn bind_param_pattern(
    pattern: &BindingPattern<'_>,
    annotation: &ConstObject,
    table: &ScopeTable,
    scope: ScopeId,
) -> Option<ShadowOut> {
    // function paint({ color }: { color: 'red' })
    let BindingPattern::ObjectPattern(obj) = pattern else {
        return None;
    };
    let mut bind = ParamBind {
        annotation,
        table,
        scope,
        listed: Vec::with_capacity(obj.properties.len()),
        blind: false,
        bound: Vec::with_capacity(obj.properties.len() + 1),
    };
    for prop in &obj.properties {
        bind.prop(prop);
    }
    bind.rest(obj.rest.as_deref());
    Some(bind.bound)
}

impl ParamBind<'_> {
    /// Bind one listed property: the entry, its default, or a shadow.
    fn prop(&mut self, prop: &oxc_ast::ast::BindingProperty<'_>) {
        let Some(key) = param_key(&prop.key) else {
            // An unresolvable key hides the exclusion set — the names
            // shadow and the rest goes blind, siblings unaffected.
            self.blind = true;
            shadow_pattern(&prop.value, &mut self.bound);
            return;
        };
        self.listed.push(key.clone());
        match &prop.value {
            BindingPattern::BindingIdentifier(id) => self.plain(&key, id),
            BindingPattern::AssignmentPattern(assign) => self.defaulted(&key, assign),
            _ => shadow_pattern(&prop.value, &mut self.bound),
        }
    }

    /// Bind a plain selection: the member's leaves, or a shadow when missing.
    fn plain(&mut self, key: &str, id: &oxc_ast::ast::BindingIdentifier<'_>) {
        // function paint({ color }: { color: 'red' })
        let init = self
            .annotation
            .get(key)
            .map(|entry| BindingInit::Scalars(entry.leaves.clone()));
        self.bound.push((id.name.to_string(), id.span, init));
    }

    /// Bind a defaulted selection: the entry wins, else the default.
    fn defaulted(&mut self, key: &str, assign: &oxc_ast::ast::AssignmentPattern<'_>) {
        let BindingPattern::BindingIdentifier(id) = &assign.left else {
            shadow_pattern(&assign.left, &mut self.bound);
            return;
        };
        if let Some(entry) = self.annotation.get(key) {
            // { color = 'blue' } over a present key — the source wins
            let init = BindingInit::Scalars(entry.leaves.clone());
            self.bound.push((id.name.to_string(), id.span, Some(init)));
            return;
        }
        // A missing key falls to the default; an unfoldable default shadows.
        let init = self
            .default_leaf(&assign.right)
            .map(|leaf| BindingInit::Scalars(vec![leaf]));
        self.bound.push((id.name.to_string(), id.span, init));
    }

    /// A default's leaf: a literal or a single-leaf identifier.
    fn default_leaf(&self, expr: &Expression<'_>) -> Option<AtomValue> {
        let peeled = peel(expr);
        if let Some(leaf) = value::literal_leaf(peeled) {
            return Some(leaf);
        }
        if let Expression::Identifier(id) = peeled {
            let (leaf, _) = value::single_scalar(self.table, self.scope, id.name.as_str())?;
            return Some(leaf);
        }
        None
    }

    /// Bind a rest element to the unlisted members, if excludable.
    fn rest(&mut self, rest: Option<&oxc_ast::ast::BindingRestElement<'_>>) {
        let Some(rest) = rest else {
            return;
        };
        let BindingPattern::BindingIdentifier(id) = &rest.argument else {
            shadow_pattern(&rest.argument, &mut self.bound);
            return;
        };
        if self.blind {
            // An unresolvable key hides the exclusion set — unknowable.
            self.bound.push((id.name.to_string(), id.span, None));
            return;
        }
        // function paint({ a, ...rest }: ...)  — everything but `a`
        let mut remaining = ConstObject::new();
        for (key, prop) in self.annotation {
            if !self.listed.iter().any(|name| name == key) {
                remaining.insert(key.clone(), prop.clone());
            }
        }
        let init = BindingInit::Object(remaining);
        self.bound.push((id.name.to_string(), id.span, Some(init)));
    }
}

/// One pattern key's annotation spelling, or None when unresolvable.
fn param_key(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(ident) => Some(ident.name.to_string()),
        PropertyKey::StringLiteral(lit) => Some(lit.value.to_string()),
        _ => None,
    }
}

/// Shadow bindings for one pattern shape.
pub(crate) type ShadowOut = Vec<(String, Span, Option<BindingInit>)>;

/// Gather every name a pattern binds as valueless shadows.
fn shadow_pattern(pattern: &BindingPattern<'_>, out: &mut ShadowOut) {
    match pattern {
        BindingPattern::BindingIdentifier(ident) => {
            out.push((ident.name.to_string(), ident.span, None));
        }
        BindingPattern::ObjectPattern(obj) => shadow_object(obj, out),
        BindingPattern::ArrayPattern(arr) => shadow_array(arr, out),
        BindingPattern::AssignmentPattern(assign) => {
            shadow_pattern(&assign.left, out);
        }
    }
}

/// Gather the names an object pattern binds: property values plus rest.
fn shadow_object(obj: &oxc_ast::ast::ObjectPattern<'_>, out: &mut ShadowOut) {
    for prop in &obj.properties {
        shadow_pattern(&prop.value, out);
    }
    if let Some(rest) = &obj.rest {
        shadow_pattern(&rest.argument, out);
    }
}

/// Gather the names an array pattern binds: elements plus rest.
fn shadow_array(arr: &oxc_ast::ast::ArrayPattern<'_>, out: &mut ShadowOut) {
    for element in arr.elements.iter().flatten() {
        shadow_pattern(element, out);
    }
    if let Some(rest) = &arr.rest {
        shadow_pattern(&rest.argument, out);
    }
}
