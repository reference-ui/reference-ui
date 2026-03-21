use oxc_span::Span;

use crate::tasty::model::TypeRef;

use super::slice_span;

pub(super) fn infer_boolean_type_span(source: &str, span: Span, const_asserted: bool) -> TypeRef {
    if const_asserted {
        return TypeRef::Literal {
            value: slice_span(source, span).to_string(),
        };
    }

    TypeRef::Intrinsic {
        name: "boolean".to_string(),
    }
}

pub(super) fn infer_numeric_type_span(source: &str, span: Span, const_asserted: bool) -> TypeRef {
    if const_asserted {
        return TypeRef::Literal {
            value: slice_span(source, span).to_string(),
        };
    }

    TypeRef::Intrinsic {
        name: "number".to_string(),
    }
}

pub(super) fn infer_string_type_span(source: &str, span: Span, const_asserted: bool) -> TypeRef {
    if const_asserted {
        return TypeRef::Literal {
            value: slice_span(source, span).to_string(),
        };
    }

    TypeRef::Intrinsic {
        name: "string".to_string(),
    }
}
