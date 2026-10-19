//! Lowering for composite type syntax.
//! Lowers arrays, object literals, tuples, functions, constructors, and type operators into structured TypeRef values.

use oxc_ast::ast::FormalParameters;
use oxc_span::{GetSpan, Span};

use crate::model::{FnParam, TemplateLiteralPart, TupleElement, TypeOperatorKind, TypeRef};
use crate::shared::type_ref_util::cross_product;

use super::super::members::members_from_signatures_in;
use super::super::slice_span;
use super::infer_binders::infer_names;
use super::mapped_modifier_kind;
use super::LoweringContext;

impl<'a> LoweringContext<'a> {
    pub(super) fn lower_array_type(&self, array_type: &oxc_ast::ast::TSArrayType<'_>) -> TypeRef {
        TypeRef::Array {
            element: Box::new(self.lower_type(&array_type.element_type)),
        }
    }

    pub(super) fn lower_type_literal(
        &self,
        type_literal: &oxc_ast::ast::TSTypeLiteral<'_>,
    ) -> TypeRef {
        TypeRef::Object {
            members: members_from_signatures_in(
                type_literal.members.as_slice(),
                &self.ctx.with_empty_comments(),
                None,
                &self.bound,
            ),
        }
    }

    pub(super) fn lower_named_tuple_member_type(
        &self,
        named: &oxc_ast::ast::TSNamedTupleMember<'_>,
    ) -> TypeRef {
        let inner = self.lower_tuple_element(&named.element_type);
        TypeRef::Tuple {
            elements: vec![TupleElement {
                label: Some(slice_span(self.ctx.source, named.label.span()).to_string()),
                optional: named.optional,
                rest: false,
                readonly: false,
                element: inner.element,
            }],
        }
    }

    pub(super) fn lower_function_type(
        &self,
        function_type: &oxc_ast::ast::TSFunctionType<'_>,
    ) -> TypeRef {
        let signature = self.bind(self.declared_names(function_type.type_parameters.as_deref()));
        TypeRef::Function {
            params: signature.lower_fn_params(&function_type.params),
            return_type: Box::new(signature.lower_type(&function_type.return_type.type_annotation)),
        }
    }

    pub(super) fn lower_constructor_type(
        &self,
        constructor_type: &oxc_ast::ast::TSConstructorType<'_>,
    ) -> TypeRef {
        let signature =
            self.bind(self.declared_names(constructor_type.type_parameters.as_deref()));
        TypeRef::Constructor {
            r#abstract: constructor_type.r#abstract,
            type_parameters: self
                .lower_type_parameters(constructor_type.type_parameters.as_deref()),
            params: signature.lower_fn_params(&constructor_type.params),
            return_type: Box::new(signature.lower_type(&constructor_type.return_type.type_annotation)),
        }
    }

    pub(super) fn lower_type_operator_type(
        &self,
        operator: &oxc_ast::ast::TSTypeOperator<'_>,
    ) -> TypeRef {
        let target_type = self.lower_type(&operator.type_annotation);
        match (type_operator_kind(&operator.operator), target_type) {
            (TypeOperatorKind::Readonly, TypeRef::Tuple { elements }) => TypeRef::Tuple {
                elements: with_readonly_elements(elements),
            },
            (kind, target) => TypeRef::TypeOperator {
                operator: kind,
                target: Box::new(target),
                resolved: None,
            },
        }
    }

    /// `typeof f<Args>` keeps its type arguments in the expression text: the query names the
    /// instantiated signature, and the bare name would describe a different type.
    pub(super) fn lower_type_query(&self, query: &oxc_ast::ast::TSTypeQuery<'_>) -> TypeRef {
        let start = query.expr_name.span().start;
        let end = query
            .type_arguments
            .as_ref()
            .map_or(query.expr_name.span().end, |arguments| arguments.span.end);
        TypeRef::TypeQuery {
            expression: slice_span(self.ctx.source, Span::new(start, end)).to_string(),
            resolved: None,
        }
    }

    /// `infer` names bind only in the true branch, and only those written in this conditional's
    /// extends clause; the check and false branches see the enclosing binders alone.
    pub(super) fn lower_conditional_type(
        &self,
        conditional: &oxc_ast::ast::TSConditionalType<'_>,
    ) -> TypeRef {
        let extends_type = self.lower_type(&conditional.extends_type);
        let true_scope = self.bind(infer_names(&extends_type));
        TypeRef::Conditional {
            check_type: Box::new(self.lower_type(&conditional.check_type)),
            extends_type: Box::new(extends_type),
            true_type: Box::new(true_scope.lower_type(&conditional.true_type)),
            false_type: Box::new(self.lower_type(&conditional.false_type)),
            resolved: None,
        }
    }

    /// The key binds in the name and value types, not in the constraint that supplies its keys.
    pub(super) fn lower_mapped_type(&self, mapped: &oxc_ast::ast::TSMappedType<'_>) -> TypeRef {
        let key = slice_span(self.ctx.source, mapped.key.span()).to_string();
        let body = self.bind(vec![key.clone()]);
        TypeRef::Mapped {
            type_param: key,
            source_type: Box::new(self.lower_type(&mapped.constraint)),
            name_type: mapped
                .name_type
                .as_ref()
                .map(|name_type| Box::new(body.lower_type(name_type))),
            optional_modifier: mapped_modifier_kind(mapped.optional),
            readonly_modifier: mapped_modifier_kind(mapped.readonly),
            value_type: mapped
                .type_annotation
                .as_ref()
                .map(|value_type| Box::new(body.lower_type(value_type))),
        }
    }

    pub(super) fn lower_template_literal_type(
        &self,
        template: &oxc_ast::ast::TSTemplateLiteralType<'_>,
    ) -> TypeRef {
        let parts = self.lower_template_literal_parts(template);
        let resolved = self.resolve_template_literal_to_union(&parts).map(Box::new);

        TypeRef::TemplateLiteral { parts, resolved }
    }

    /// Try to resolve a template literal to a union when possible
    /// For simple cases like `/${'users' | 'posts'}/${'list' | 'detail'}` -> `'/users/list' | '/users/detail' | '/posts/list' | '/posts/detail'`
    /// Each part multiplies the variants so far. A product past the evaluator's member cap is not built:
    /// `cross_product` returns `None`, the template keeps its parts, and it has no resolved union.
    fn resolve_template_literal_to_union(
        &self,
        parts: &[crate::model::TemplateLiteralPart],
    ) -> Option<TypeRef> {
        let mut variants = vec![String::new()];

        for part in parts {
            let fragments = match part {
                crate::model::TemplateLiteralPart::Text { value } => vec![value.clone()],
                crate::model::TemplateLiteralPart::Type { value } => {
                    self.template_literal_fragments(value)?
                }
            };
            variants = cross_product(&variants, &fragments)?;
        }

        let mut union_types: Vec<TypeRef> = variants
            .into_iter()
            .map(|variant| TypeRef::Literal { value: variant })
            .collect();

        if union_types.len() == 1 {
            union_types.pop()
        } else {
            Some(TypeRef::Union { types: union_types })
        }
    }

    fn template_literal_fragments(&self, type_ref: &TypeRef) -> Option<Vec<String>> {
        match type_ref {
            TypeRef::Literal { value } => Some(vec![value.clone()]),
            TypeRef::Union { types } => {
                let mut fragments = Vec::new();
                for item in types {
                    fragments.extend(self.template_literal_fragments(item)?);
                }
                Some(fragments)
            }
            _ => None,
        }
    }

    pub(super) fn lower_fn_params(&self, params: &FormalParameters<'_>) -> Vec<FnParam> {
        let mut lowered_params =
            Vec::with_capacity(params.items.len() + params.rest.as_ref().map(|_| 1).unwrap_or(0));

        for param in &params.items {
            lowered_params.push(FnParam {
                name: Some(slice_span(self.ctx.source, param.pattern.span()).to_string()),
                optional: param.optional,
                type_ref: param
                    .type_annotation
                    .as_ref()
                    .map(|annotation| self.lower_type(&annotation.type_annotation)),
            });
        }

        if let Some(rest) = &params.rest {
            lowered_params.push(FnParam {
                name: Some(slice_span(self.ctx.source, rest.rest.span()).to_string()),
                optional: false,
                type_ref: rest
                    .type_annotation
                    .as_ref()
                    .map(|annotation| self.lower_type(&annotation.type_annotation)),
            });
        }

        lowered_params
    }

    pub(super) fn lower_template_literal_parts(
        &self,
        template: &oxc_ast::ast::TSTemplateLiteralType<'_>,
    ) -> Vec<TemplateLiteralPart> {
        let mut parts = Vec::with_capacity(template.quasis.len() + template.types.len());

        for (index, quasi) in template.quasis.iter().enumerate() {
            parts.push(TemplateLiteralPart::Text {
                value: quasi.value.raw.as_str().to_string(),
            });

            if let Some(type_part) = template.types.get(index) {
                parts.push(TemplateLiteralPart::Type {
                    value: self.lower_type(type_part),
                });
            }
        }

        parts
    }
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeSet;
    use std::path::Path;
    use std::rc::Rc;

    use crate::ast::extract_ast;
    use crate::ast::model::SymbolShell;
    use crate::model::TypeRef;
    use crate::scanner::{ImportResolver, ScannedFile, ScannedWorkspace};

    /// `export type Combo = ...` with `holes` template holes, each a union of ten string literals.
    fn combo_source(holes: usize) -> String {
        let body: String = (0..holes)
            .map(|hole| {
                let members: Vec<String> = (0..10).map(|i| format!("'h{hole}_{i}'")).collect();
                format!("${{{}}}", members.join(" | "))
            })
            .collect();
        format!("export type Combo = `{body}`;\n")
    }

    fn combo_underlying(source: &str) -> TypeRef {
        let scanned = ScannedWorkspace {
            resolver: Rc::new(ImportResolver::new(Path::new("."))),
            files: vec![ScannedFile {
                file_id: "combo.ts".to_string(),
                module_specifier: "combo.ts".to_string(),
                library: "user".to_string(),
                source: source.to_string(),
            }],
            file_ids: BTreeSet::from(["combo.ts".to_string()]),
            bridged_libraries: BTreeSet::new(),
        };
        let ast = extract_ast(&scanned).expect("extract should succeed");
        let shell: &SymbolShell = ast.files[0]
            .exports
            .iter()
            .find(|shell| shell.name == "Combo")
            .expect("Combo should be extracted");
        shell
            .underlying
            .clone()
            .expect("type alias should have underlying")
    }

    #[test]
    fn template_expansion_past_member_cap_keeps_parts_unexpanded() {
        // Four holes of ten literals make 10,000 members, past the 1000 cap: no union is built.
        match combo_underlying(&combo_source(4)) {
            TypeRef::TemplateLiteral { parts, resolved } => {
                assert_eq!(parts.len(), 9);
                assert!(resolved.is_none());
            }
            other => panic!("expected TemplateLiteral, got {other:?}"),
        }
    }

    #[test]
    fn template_expansion_at_member_cap_builds_the_full_union() {
        // Three holes of ten literals make exactly 1000 members, which the cap still allows.
        match combo_underlying(&combo_source(3)) {
            TypeRef::TemplateLiteral {
                resolved: Some(resolved),
                ..
            } => match *resolved {
                TypeRef::Union { types } => assert_eq!(types.len(), 1000),
                other => panic!("expected Union, got {other:?}"),
            },
            other => panic!("expected resolved TemplateLiteral, got {other:?}"),
        }
    }
}

/// The model's operator kind for an Oxc type operator.
fn type_operator_kind(operator: &oxc_ast::ast::TSTypeOperatorOperator) -> TypeOperatorKind {
    match operator {
        oxc_ast::ast::TSTypeOperatorOperator::Keyof => TypeOperatorKind::Keyof,
        oxc_ast::ast::TSTypeOperatorOperator::Readonly => TypeOperatorKind::Readonly,
        oxc_ast::ast::TSTypeOperatorOperator::Unique => TypeOperatorKind::Unique,
    }
}

/// A readonly tuple normalizes to a tuple whose elements are each readonly.
fn with_readonly_elements(elements: Vec<TupleElement>) -> Vec<TupleElement> {
    elements
        .into_iter()
        .map(|element| TupleElement {
            readonly: true,
            ..element
        })
        .collect()
}
