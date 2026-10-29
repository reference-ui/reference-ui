//! Lowers Oxc type annotations into `TypeRef` values, carrying the names that enclosing binders bind.
//! A binder is a function or constructor type's parameters, a method or call signature's own parameters,
//! a mapped type's key, or an `infer` variable in a conditional's true branch; the lowering passes those
//! names down as `bound`. A reference to a bound name names itself as its target id, which no symbol id
//! ever equals, and carries the `type_parameter` flag, so the resolver does not attach it to a same-named
//! top-level symbol. The resolver clears the target before a symbol leaves resolution and keeps the flag.
//! Interface and type-alias parameters are not visible here; the resolver binds those for the whole
//! declaration.

use oxc_ast::ast::{TSType, TSTypeParameterDeclaration};

use crate::ast::model::ImportBindingKind;
use crate::constants::libraries::USER_LIBRARY_NAME;
use crate::shared::type_ref_util::reference_lookup_name;

use super::slice_span;
use crate::ast::extract::ExtractionContext;
use crate::model::{MappedModifierKind, TsTypeParameter, TypeRef};
use oxc_span::GetSpan;

mod infer_binders;
mod lower_composites;
mod lower_keywords;
mod lower_references;
mod lower_signatures;
mod lower_tuples;

pub(super) use lower_signatures::{
    signature_to_constructor_ref, signature_to_function_ref, SignatureParts,
};

/// Lowering state: the extraction inputs and the names bound by the enclosing declarations and binders.
struct LoweringContext<'a> {
    ctx: &'a ExtractionContext<'a>,
    bound: Vec<String>,
}

impl<'a> LoweringContext<'a> {
    fn new(ctx: &'a ExtractionContext<'a>) -> Self {
        Self::with_bound(ctx, Vec::new())
    }

    fn with_bound(ctx: &'a ExtractionContext<'a>, bound: Vec<String>) -> Self {
        Self { ctx, bound }
    }

    /// Child context that binds `names` on top of this one, for the part of a declaration they scope.
    fn bind(&self, names: Vec<String>) -> LoweringContext<'a> {
        let mut bound = self.bound.clone();
        bound.extend(names);
        Self::with_bound(self.ctx, bound)
    }

    fn is_bound(&self, name: &str) -> bool {
        self.bound.iter().any(|bound| bound == name)
    }

    /// Names a type-parameter list declares, in source order.
    fn declared_names(&self, decl: Option<&TSTypeParameterDeclaration<'_>>) -> Vec<String> {
        decl.map_or_else(Vec::new, |decl| {
            decl.params
                .iter()
                .map(|param| slice_span(self.ctx.source, param.name.span()).to_string())
                .collect()
        })
    }

    /// Lowers an inner binder's own parameter list, such as a constructor type's. The list binds its own names
    /// first, so a constraint or default that names a sibling is flagged here instead of captured.
    pub(super) fn lower_type_parameters<'b>(
        &self,
        decl: Option<&TSTypeParameterDeclaration<'b>>,
    ) -> Vec<TsTypeParameter> {
        self.bind(self.declared_names(decl))
            .lower_parameter_list(decl)
    }

    /// Lowers each parameter's constraint and default in this scope, with the names this scope binds.
    fn lower_parameter_list<'b>(
        &self,
        decl: Option<&TSTypeParameterDeclaration<'b>>,
    ) -> Vec<TsTypeParameter> {
        let Some(decl) = decl else {
            return Vec::new();
        };

        decl.params
            .iter()
            .map(|param| TsTypeParameter {
                name: slice_span(self.ctx.source, param.name.span()).to_string(),
                constraint: param
                    .constraint
                    .as_ref()
                    .map(|constraint| self.lower_type(constraint)),
                default: param
                    .default
                    .as_ref()
                    .map(|default| self.lower_type(default)),
            })
            .collect()
    }

    /// The one exhaustive match over the oxc `TSType` variants. Each arm sends one family to its function, and no
    /// family calls another, so a variant that oxc adds is a compile error here until it is routed.
    pub(super) fn lower_type(&self, type_annotation: &TSType<'_>) -> TypeRef {
        match type_annotation {
            TSType::TSStringKeyword(_)
            | TSType::TSNumberKeyword(_)
            | TSType::TSBooleanKeyword(_)
            | TSType::TSUnknownKeyword(_)
            | TSType::TSAnyKeyword(_)
            | TSType::TSUndefinedKeyword(_)
            | TSType::TSNullKeyword(_)
            | TSType::TSObjectKeyword(_)
            | TSType::TSBigIntKeyword(_)
            | TSType::TSSymbolKeyword(_)
            | TSType::TSNeverKeyword(_)
            | TSType::TSVoidKeyword(_)
            | TSType::TSIntrinsicKeyword(_)
            | TSType::TSLiteralType(_)
            | TSType::TSImportType(_)
            | TSType::TSInferType(_)
            | TSType::TSTypePredicate(_)
            | TSType::TSThisType(_)
            | TSType::JSDocNullableType(_)
            | TSType::JSDocNonNullableType(_)
            | TSType::JSDocUnknownType(_) => self.lower_leaf_type(type_annotation),
            TSType::TSUnionType(_)
            | TSType::TSIntersectionType(_)
            | TSType::TSArrayType(_)
            | TSType::TSTupleType(_) => self.lower_list_type(type_annotation),
            TSType::TSTypeLiteral(_)
            | TSType::TSNamedTupleMember(_)
            | TSType::TSIndexedAccessType(_)
            | TSType::TSTypeOperatorType(_) => self.lower_member_type(type_annotation),
            TSType::TSFunctionType(_)
            | TSType::TSConstructorType(_)
            | TSType::TSTypeQuery(_)
            | TSType::TSMappedType(_) => self.lower_signature_type(type_annotation),
            TSType::TSParenthesizedType(_)
            | TSType::TSTypeReference(_)
            | TSType::TSConditionalType(_)
            | TSType::TSTemplateLiteralType(_) => self.lower_nested_type(type_annotation),
        }
    }

    /// Keywords, intrinsic keywords, literal types, and the variants that stay raw. Each lowers to one scalar or to
    /// its source text, with no child types to lower.
    fn lower_leaf_type(&self, type_annotation: &TSType<'_>) -> TypeRef {
        match type_annotation {
            TSType::TSStringKeyword(_)
            | TSType::TSNumberKeyword(_)
            | TSType::TSBooleanKeyword(_)
            | TSType::TSUnknownKeyword(_)
            | TSType::TSAnyKeyword(_)
            | TSType::TSUndefinedKeyword(_)
            | TSType::TSNullKeyword(_)
            | TSType::TSObjectKeyword(_)
            | TSType::TSBigIntKeyword(_)
            | TSType::TSSymbolKeyword(_)
            | TSType::TSNeverKeyword(_)
            | TSType::TSVoidKeyword(_) => self.lower_keyword_type(type_annotation),
            TSType::TSIntrinsicKeyword(keyword) => self.lower_intrinsic_keyword(keyword),
            TSType::TSLiteralType(literal) => self.lower_literal_type(literal),
            TSType::TSImportType(_)
            | TSType::TSInferType(_)
            | TSType::TSTypePredicate(_)
            | TSType::TSThisType(_)
            | TSType::JSDocNullableType(_)
            | TSType::JSDocNonNullableType(_)
            | TSType::JSDocUnknownType(_) => self.raw_type(type_annotation),
            _ => unreachable!("lower_type routes only leaf variants here"),
        }
    }

    /// Unions, intersections, arrays, and tuples.
    fn lower_list_type(&self, type_annotation: &TSType<'_>) -> TypeRef {
        match type_annotation {
            TSType::TSUnionType(union) => TypeRef::Union {
                types: self.lower_type_list(&union.types),
            },
            TSType::TSIntersectionType(intersection) => TypeRef::Intersection {
                types: self.lower_type_list(&intersection.types),
            },
            TSType::TSArrayType(array_type) => self.lower_array_type(array_type),
            TSType::TSTupleType(tuple_type) => self.lower_tuple_type(tuple_type),
            _ => unreachable!("lower_type routes only list variants here"),
        }
    }

    /// Type literals, named tuple members, and indexed or operator access.
    fn lower_member_type(&self, type_annotation: &TSType<'_>) -> TypeRef {
        match type_annotation {
            TSType::TSTypeLiteral(type_literal) => self.lower_type_literal(type_literal),
            TSType::TSNamedTupleMember(named) => self.lower_named_tuple_member_type(named),
            TSType::TSIndexedAccessType(indexed_access) => {
                self.lower_indexed_access_type(indexed_access)
            }
            TSType::TSTypeOperatorType(operator) => self.lower_type_operator_type(operator),
            _ => unreachable!("lower_type routes only member variants here"),
        }
    }

    /// Function and constructor types, type queries, and mapped types.
    fn lower_signature_type(&self, type_annotation: &TSType<'_>) -> TypeRef {
        match type_annotation {
            TSType::TSFunctionType(function_type) => self.lower_function_type(function_type),
            TSType::TSConstructorType(constructor_type) => {
                self.lower_constructor_type(constructor_type)
            }
            TSType::TSTypeQuery(query) => self.lower_type_query(query),
            TSType::TSMappedType(mapped) => self.lower_mapped_type(mapped),
            _ => unreachable!("lower_type routes only signature variants here"),
        }
    }

    /// Parentheses, type references, and conditional and template literal types. Each lowers child types of its own,
    /// and a parenthesized type passes straight through to the type it wraps.
    fn lower_nested_type(&self, type_annotation: &TSType<'_>) -> TypeRef {
        match type_annotation {
            TSType::TSParenthesizedType(parenthesized) => {
                self.lower_type(&parenthesized.type_annotation)
            }
            TSType::TSTypeReference(reference) => self.lower_type_reference(reference),
            TSType::TSConditionalType(conditional) => self.lower_conditional_type(conditional),
            TSType::TSTemplateLiteralType(template) => self.lower_template_literal_type(template),
            _ => unreachable!("lower_type routes only nested variants here"),
        }
    }

    pub(super) fn lower_type_list(&self, types: &[TSType<'_>]) -> Vec<TypeRef> {
        types.iter().map(|nested| self.lower_type(nested)).collect()
    }

    pub(super) fn raw_type(&self, type_annotation: &TSType<'_>) -> TypeRef {
        raw_type(type_annotation, self.ctx.source)
    }
}

/// Lowers an interface's or a type alias's own parameters. Their names are not bound here, so a default that names
/// an earlier parameter stays unbound in the shell like the rest of it. The resolver flags it when the declaration
/// resolves, and an expansion instantiates it with that parameter's argument.
pub(super) fn type_parameters_from_oxc<'a>(
    decl: Option<&TSTypeParameterDeclaration<'a>>,
    ctx: &ExtractionContext<'_>,
) -> Vec<TsTypeParameter> {
    LoweringContext::new(ctx).lower_parameter_list(decl)
}

pub(super) fn type_to_ref(type_annotation: &TSType<'_>, ctx: &ExtractionContext<'_>) -> TypeRef {
    LoweringContext::new(ctx).lower_type(type_annotation)
}

/// Lowers a member's type. `binders` are the names bound by enclosing declarations; `own` is the
/// member's own type-parameter list (`run<Item>(): Item`), which binds only within this type.
pub(super) fn member_type_to_ref(
    type_annotation: &TSType<'_>,
    ctx: &ExtractionContext<'_>,
    binders: &[String],
    own: Option<&TSTypeParameterDeclaration<'_>>,
) -> TypeRef {
    let base = LoweringContext::with_bound(ctx, binders.to_vec());
    base.bind(base.declared_names(own))
        .lower_type(type_annotation)
}

pub(super) fn interface_heritage_to_reference(
    heritage: &oxc_ast::ast::TSInterfaceHeritage<'_>,
    ctx: &ExtractionContext<'_>,
) -> TypeRef {
    LoweringContext::new(ctx).lower_interface_heritage(heritage)
}

/// A reference to a bound name. It names itself as its target id, which no symbol id equals, it is
/// flagged as a type parameter, and it takes the file's default source rather than an import the
/// binder shadows.
pub(super) fn bound_reference(
    name: String,
    type_arguments: Option<Vec<TypeRef>>,
    ctx: &ExtractionContext<'_>,
) -> TypeRef {
    TypeRef::Reference {
        target_id: Some(name.clone()),
        source_module: default_source_module(ctx),
        name,
        type_arguments,
        type_parameter: true,
    }
}

fn mapped_modifier_kind(
    modifier: Option<oxc_ast::ast::TSMappedTypeModifierOperator>,
) -> MappedModifierKind {
    match modifier {
        None => MappedModifierKind::Preserve,
        Some(oxc_ast::ast::TSMappedTypeModifierOperator::True)
        | Some(oxc_ast::ast::TSMappedTypeModifierOperator::Plus) => MappedModifierKind::Add,
        Some(oxc_ast::ast::TSMappedTypeModifierOperator::Minus) => MappedModifierKind::Remove,
    }
}

fn reference_source_module(reference_name: &str, ctx: &ExtractionContext<'_>) -> Option<String> {
    let lookup_name = reference_lookup_name(reference_name);

    // An alias names no module of its own; a reference that still starts with one falls back to the file's default.
    ctx.import_bindings
        .get(lookup_name)
        .filter(|binding| !matches!(binding.kind, ImportBindingKind::Alias))
        .map(|binding| binding.source_module.clone())
        .or_else(|| default_source_module(ctx))
}

/// The source of a reference that no import claims: the file's own module in a library, none in user code.
fn default_source_module(ctx: &ExtractionContext<'_>) -> Option<String> {
    if ctx.library == USER_LIBRARY_NAME {
        None
    } else {
        Some(ctx.module_specifier.to_string())
    }
}

fn intrinsic(name: &str) -> TypeRef {
    TypeRef::Intrinsic {
        name: name.to_string(),
    }
}

fn raw_type(type_annotation: &TSType<'_>, source: &str) -> TypeRef {
    TypeRef::Raw {
        summary: slice_span(source, type_annotation.span()).to_string(),
    }
}
