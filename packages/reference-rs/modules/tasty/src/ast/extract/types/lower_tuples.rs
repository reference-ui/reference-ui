//! Lowers tuple types and their elements: optional, rest, and labeled members, each becoming a `TupleElement`.
//! A rest element may carry a label (`...rest: boolean[]`), which the parser wraps as a rest element around a
//! named member, and that label and the rest flag belong to one element. Elements that the structured arms do
//! not cover fall back to a synthetic reparse of the element source, so they still lower through the normal
//! type path.

use oxc_allocator::Allocator;
use oxc_ast::ast::{TSTupleElement, TSType};
use shared::parse::parse_bounded;
use oxc_span::{GetSpan, SourceType};

use crate::model::{TupleElement, TypeRef};

use super::super::slice_span;
use super::LoweringContext;
use crate::ast::extract::ExtractionContext;

impl<'a> LoweringContext<'a> {
    pub(super) fn lower_tuple_type(&self, tuple_type: &oxc_ast::ast::TSTupleType<'_>) -> TypeRef {
        TypeRef::Tuple {
            elements: tuple_type
                .element_types
                .iter()
                .map(|element| self.lower_tuple_element(element))
                .collect(),
        }
    }

    pub(super) fn lower_tuple_element(&self, element: &TSTupleElement<'_>) -> TupleElement {
        match element {
            TSTupleElement::TSOptionalType(optional) => TupleElement {
                label: None,
                optional: true,
                rest: false,
                readonly: false,
                element: self.lower_type(&optional.type_annotation),
            },
            TSTupleElement::TSRestType(rest) => self.rest_element(rest),
            TSTupleElement::TSNamedTupleMember(named) => {
                let lowered = self.lower_tuple_element(&named.element_type);

                TupleElement {
                    label: Some(slice_span(self.ctx.source, named.label.span()).to_string()),
                    optional: named.optional,
                    rest: false,
                    readonly: false,
                    element: lowered.element,
                }
            }
            _ => TupleElement {
                label: None,
                optional: false,
                rest: false,
                readonly: false,
                element: self.lower_tuple_element_type(element),
            },
        }
    }

    fn rest_element(&self, rest: &oxc_ast::ast::TSRestType<'_>) -> TupleElement {
        match &rest.type_annotation {
            TSType::TSNamedTupleMember(named) => self.named_rest_element(named),
            annotation => TupleElement {
                label: None,
                optional: false,
                rest: true,
                readonly: false,
                element: self.lower_type(annotation),
            },
        }
    }

    /// `...name: T[]`: the label and the rest flag both belong to the one element, whose type is the lowered `T[]`.
    fn named_rest_element(&self, named: &oxc_ast::ast::TSNamedTupleMember<'_>) -> TupleElement {
        TupleElement {
            label: Some(slice_span(self.ctx.source, named.label.span()).to_string()),
            optional: named.optional,
            rest: true,
            readonly: false,
            element: self.lower_tuple_element(&named.element_type).element,
        }
    }

    /// HACK: synthetic reparse of a single tuple element via a type alias wrapper.
    pub(super) fn lower_tuple_element_type(&self, element: &TSTupleElement<'_>) -> TypeRef {
        let element_source = slice_span(self.ctx.source, element.span());
        let wrapped_source = format!("type __TastyTupleElement = {element_source};");
        let allocator = Allocator::default();
        let source_type = SourceType::from_path("tuple-element.ts").unwrap_or_default();
        // A refused wrapper falls back to the raw summary, the same as an element the wrapper cannot parse.
        let Ok(parse_result) = parse_bounded(&allocator, &wrapped_source, source_type) else {
            return TypeRef::Raw {
                summary: element_source.to_string(),
            };
        };

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

        // Unreachable for error-free sources: a clean tuple element is a complete standalone
        // type, so its wrapper parses to an alias. The elements whose wrapper parse fails (a bare
        // `unique`, `readonly`, `keyof` or `infer`) fail the main parse as well, so their file
        // already carries TST-W-PARSE-ERROR and this summary is only a last resort.
        TypeRef::Raw {
            summary: element_source.to_string(),
        }
    }
}
