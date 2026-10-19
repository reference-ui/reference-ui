//! Lowering for keyword and literal types.
//! Maps intrinsic keywords and literal annotations to their TypeRef leaves, preserving keyword text for intrinsics.

use oxc_ast::ast::TSType;
use oxc_span::GetSpan;

use crate::model::TypeRef;

use super::super::slice_span;
use super::intrinsic;
use super::LoweringContext;

impl<'a> LoweringContext<'a> {
    /// The intrinsic type a keyword annotation lowers to. Only the leaf family calls this, with one of the twelve
    /// keyword variants, so a name that does not resolve is a routing bug, not an input.
    pub(super) fn lower_keyword_type(&self, type_annotation: &TSType<'_>) -> TypeRef {
        keyword_name(type_annotation)
            .map(intrinsic)
            .unwrap_or_else(|| unreachable!("lower_type routes only keyword variants here"))
    }

    pub(super) fn lower_intrinsic_keyword(
        &self,
        keyword: &oxc_ast::ast::TSIntrinsicKeyword,
    ) -> TypeRef {
        TypeRef::Intrinsic {
            name: slice_span(self.ctx.source, keyword.span()).to_string(),
        }
    }

    pub(super) fn lower_literal_type(&self, literal: &oxc_ast::ast::TSLiteralType<'_>) -> TypeRef {
        TypeRef::Literal {
            value: slice_span(self.ctx.source, literal.span).to_string(),
        }
    }
}

/// The name of a keyword annotation. The twelve keywords are split across three matches, each within the arm
/// budget of the complexity gate; the first match that names the annotation wins.
fn keyword_name(type_annotation: &TSType<'_>) -> Option<&'static str> {
    value_keyword_name(type_annotation)
        .or_else(|| wide_keyword_name(type_annotation))
        .or_else(|| nullish_keyword_name(type_annotation))
}

fn value_keyword_name(type_annotation: &TSType<'_>) -> Option<&'static str> {
    match type_annotation {
        TSType::TSStringKeyword(_) => Some("string"),
        TSType::TSNumberKeyword(_) => Some("number"),
        TSType::TSBooleanKeyword(_) => Some("boolean"),
        TSType::TSBigIntKeyword(_) => Some("bigint"),
        _ => None,
    }
}

fn wide_keyword_name(type_annotation: &TSType<'_>) -> Option<&'static str> {
    match type_annotation {
        TSType::TSAnyKeyword(_) => Some("any"),
        TSType::TSUnknownKeyword(_) => Some("unknown"),
        TSType::TSObjectKeyword(_) => Some("object"),
        TSType::TSSymbolKeyword(_) => Some("symbol"),
        _ => None,
    }
}

fn nullish_keyword_name(type_annotation: &TSType<'_>) -> Option<&'static str> {
    match type_annotation {
        TSType::TSUndefinedKeyword(_) => Some("undefined"),
        TSType::TSNullKeyword(_) => Some("null"),
        TSType::TSNeverKeyword(_) => Some("never"),
        TSType::TSVoidKeyword(_) => Some("void"),
        _ => None,
    }
}
