mod arrays;
mod objects;
mod primitives;

pub(crate) use arrays::infer_array_type;
pub(crate) use objects::infer_object_type;
pub(crate) use primitives::{
    infer_boolean_type_span, infer_numeric_type_span, infer_string_type_span,
};
