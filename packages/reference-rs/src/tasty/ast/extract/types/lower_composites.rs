use oxc_allocator::Allocator;
use oxc_ast::ast::{FormalParameters, TSTupleElement};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};

use crate::tasty::model::{FnParam, TemplateLiteralPart, TupleElement, TypeOperatorKind, TypeRef};

use crate::tasty::ast::extract::ExtractionContext;
use super::super::members::members_from_signatures;
use super::super::slice_span;
use super::mapped_modifier_kind;
use super::LoweringContext;

impl<'a> LoweringContext<'a> {
    pub(super) fn lower_array_type(&self, array_type: &oxc_ast::ast::TSArrayType<'_>) -> TypeRef {
        TypeRef::Array {
            element: Box::new(self.lower_type(&array_type.element_type)),
        }
    }

    pub(super) fn lower_tuple_type(&self, tuple_type: &oxc_ast::ast::TSTupleType<'_>) -> TypeRef {
        TypeRef::Tuple {
            elements: tuple_type
                .element_types
                .iter()
                .map(|element| self.lower_tuple_element(element))
                .collect(),
        }
    }

    pub(super) fn lower_type_literal(
        &self,
        type_literal: &oxc_ast::ast::TSTypeLiteral<'_>,
    ) -> TypeRef {
        TypeRef::Object {
            members: members_from_signatures(
                type_literal.members.as_slice(),
                &self.ctx.with_empty_comments(),
                None,
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
                element: inner.element,
            }],
        }
    }

    pub(super) fn lower_function_type(
        &self,
        function_type: &oxc_ast::ast::TSFunctionType<'_>,
    ) -> TypeRef {
        TypeRef::Function {
            params: self.lower_fn_params(&function_type.params),
            return_type: Box::new(self.lower_type(&function_type.return_type.type_annotation)),
        }
    }

    pub(super) fn lower_constructor_type(
        &self,
        constructor_type: &oxc_ast::ast::TSConstructorType<'_>,
    ) -> TypeRef {
        TypeRef::Constructor {
            r#abstract: constructor_type.r#abstract,
            type_parameters: self
                .lower_type_parameters(constructor_type.type_parameters.as_deref()),
            params: self.lower_fn_params(&constructor_type.params),
            return_type: Box::new(self.lower_type(&constructor_type.return_type.type_annotation)),
        }
    }

    pub(super) fn lower_type_operator_type(
        &self,
        operator: &oxc_ast::ast::TSTypeOperator<'_>,
    ) -> TypeRef {
        TypeRef::TypeOperator {
            operator: match operator.operator {
                oxc_ast::ast::TSTypeOperatorOperator::Keyof => TypeOperatorKind::Keyof,
                oxc_ast::ast::TSTypeOperatorOperator::Readonly => TypeOperatorKind::Readonly,
                oxc_ast::ast::TSTypeOperatorOperator::Unique => TypeOperatorKind::Unique,
            },
            target: Box::new(self.lower_type(&operator.type_annotation)),
            resolved: None,
        }
    }

    pub(super) fn lower_type_query(&self, query: &oxc_ast::ast::TSTypeQuery<'_>) -> TypeRef {
        TypeRef::TypeQuery {
            expression: slice_span(self.ctx.source, query.expr_name.span()).to_string(),
            resolved: None,
        }
    }

    pub(super) fn lower_conditional_type(
        &self,
        conditional: &oxc_ast::ast::TSConditionalType<'_>,
    ) -> TypeRef {
        TypeRef::Conditional {
            check_type: Box::new(self.lower_type(&conditional.check_type)),
            extends_type: Box::new(self.lower_type(&conditional.extends_type)),
            true_type: Box::new(self.lower_type(&conditional.true_type)),
            false_type: Box::new(self.lower_type(&conditional.false_type)),
            resolved: None,
        }
    }

    pub(super) fn lower_mapped_type(&self, mapped: &oxc_ast::ast::TSMappedType<'_>) -> TypeRef {
        TypeRef::Mapped {
            type_param: slice_span(self.ctx.source, mapped.key.span()).to_string(),
            source_type: Box::new(self.lower_type(&mapped.constraint)),
            name_type: mapped
                .name_type
                .as_ref()
                .map(|name_type| Box::new(self.lower_type(name_type))),
            optional_modifier: mapped_modifier_kind(mapped.optional),
            readonly_modifier: mapped_modifier_kind(mapped.readonly),
            value_type: mapped
                .type_annotation
                .as_ref()
                .map(|value_type| Box::new(self.lower_type(value_type))),
        }
    }

    pub(super) fn lower_template_literal_type(
        &self,
        template: &oxc_ast::ast::TSTemplateLiteralType<'_>,
    ) -> TypeRef {
        TypeRef::TemplateLiteral {
            parts: self.lower_template_literal_parts(template),
            resolved: None,
        }
    }

    pub(super) fn lower_tuple_element(&self, element: &TSTupleElement<'_>) -> TupleElement {
        match element {
            TSTupleElement::TSOptionalType(optional) => TupleElement {
                label: None,
                optional: true,
                rest: false,
                element: self.lower_type(&optional.type_annotation),
            },
            TSTupleElement::TSRestType(rest) => TupleElement {
                label: None,
                optional: false,
                rest: true,
                element: self.lower_type(&rest.type_annotation),
            },
            TSTupleElement::TSNamedTupleMember(named) => {
                let lowered = self.lower_tuple_element(&named.element_type);

                TupleElement {
                    label: Some(slice_span(self.ctx.source, named.label.span()).to_string()),
                    optional: named.optional,
                    rest: false,
                    element: lowered.element,
                }
            }
            _ => TupleElement {
                label: None,
                optional: false,
                rest: false,
                element: self.lower_tuple_element_type(element),
            },
        }
    }

    /// HACK: synthetic reparse of a single tuple element via a type alias wrapper.
    pub(super) fn lower_tuple_element_type(&self, element: &TSTupleElement<'_>) -> TypeRef {
        let element_source = slice_span(self.ctx.source, element.span());
        let wrapped_source = format!("type __TastyTupleElement = {element_source};");
        let allocator = Allocator::default();
        let source_type = SourceType::from_path("tuple-element.ts").unwrap_or_default();
        let parse_result = Parser::new(&allocator, &wrapped_source, source_type).parse();

        // Reparse a single tuple element through a synthetic alias so we can reuse
        // the normal type-lowering path without special-casing every tuple variant.
        if let Some(oxc_ast::ast::Statement::TSTypeAliasDeclaration(type_alias)) =
            parse_result.program.body.first()
        {
            let ctx = ExtractionContext {
                source: wrapped_source.as_str(),
                comments: &[],
                import_bindings: self.ctx.import_bindings,
                module_specifier: self.ctx.module_specifier,
                library: self.ctx.library,
            };
            return LoweringContext::new(&ctx).lower_type(&type_alias.type_annotation);
        }

        TypeRef::Raw {
            summary: element_source.to_string(),
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
