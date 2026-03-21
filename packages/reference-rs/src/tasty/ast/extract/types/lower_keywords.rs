use oxc_ast::ast::TSType;
use oxc_span::GetSpan;

use crate::tasty::model::TypeRef;

use super::LoweringContext;
use super::intrinsic;
use super::super::slice_span;

impl<'a> LoweringContext<'a> {
    pub(super) fn lower_keyword_type(&self, type_annotation: &TSType<'_>) -> Option<TypeRef> {
        let name = match type_annotation {
            TSType::TSStringKeyword(_) => "string",
            TSType::TSNumberKeyword(_) => "number",
            TSType::TSBooleanKeyword(_) => "boolean",
            TSType::TSUnknownKeyword(_) => "unknown",
            TSType::TSAnyKeyword(_) => "any",
            TSType::TSUndefinedKeyword(_) => "undefined",
            TSType::TSNullKeyword(_) => "null",
            TSType::TSObjectKeyword(_) => "object",
            TSType::TSBigIntKeyword(_) => "bigint",
            TSType::TSSymbolKeyword(_) => "symbol",
            TSType::TSNeverKeyword(_) => "never",
            TSType::TSVoidKeyword(_) => "void",
            _ => return None,
        };

        Some(intrinsic(name))
    }

    pub(super) fn lower_intrinsic_keyword(&self, keyword: &oxc_ast::ast::TSIntrinsicKeyword) -> TypeRef {
        TypeRef::Intrinsic {
            name: slice_span(self.source, keyword.span()).to_string(),
        }
    }

    pub(super) fn lower_literal_type(&self, literal: &oxc_ast::ast::TSLiteralType<'_>) -> TypeRef {
        TypeRef::Literal {
            value: slice_span(self.source, literal.span).to_string(),
        }
    }
}
