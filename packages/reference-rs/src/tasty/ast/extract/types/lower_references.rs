use oxc_span::GetSpan;

use crate::tasty::model::TypeRef;
use crate::tasty::shared::type_ref_util::reference_lookup_name;

use super::super::slice_span;
use super::reference_source_module;
use super::LoweringContext;

impl<'a> LoweringContext<'a> {
    pub(super) fn lower_indexed_access_type(
        &self,
        indexed_access: &oxc_ast::ast::TSIndexedAccessType<'_>,
    ) -> TypeRef {
        TypeRef::IndexedAccess {
            object: Box::new(self.lower_type(&indexed_access.object_type)),
            index: Box::new(self.lower_type(&indexed_access.index_type)),
            resolved: None,
        }
    }

    pub(super) fn lower_type_reference(
        &self,
        reference: &oxc_ast::ast::TSTypeReference<'_>,
    ) -> TypeRef {
        let name = slice_span(self.ctx.source, reference.type_name.span()).to_string();
        let lookup_name = reference_lookup_name(&name);
        let type_arguments = reference.type_arguments.as_ref().map(|instantiation| {
            instantiation
                .params
                .iter()
                .map(|argument| self.lower_type(argument))
                .collect::<Vec<_>>()
        });

        if lookup_name == "Array" {
            if let Some([element]) = type_arguments.as_deref() {
                return TypeRef::Array {
                    element: Box::new(element.clone()),
                };
            }
        }

        let source_module = self.reference_source_module(&name);
        TypeRef::Reference {
            name,
            target_id: None,
            source_module,
            type_arguments,
        }
    }

    /// `TSInterfaceHeritage` splits `extends Foo<A, B>` into `expression` (`Foo`) and `type_arguments`.
    /// Lower both so utility types like `Omit` retain their type arguments.
    pub(super) fn lower_interface_heritage(
        &self,
        heritage: &oxc_ast::ast::TSInterfaceHeritage<'_>,
    ) -> TypeRef {
        let name = slice_span(self.ctx.source, heritage.expression.span()).to_string();
        let lookup_name = reference_lookup_name(&name);
        let type_arguments = heritage.type_arguments.as_ref().map(|instantiation| {
            instantiation
                .params
                .iter()
                .map(|argument| self.lower_type(argument))
                .collect::<Vec<_>>()
        });

        if lookup_name == "Array" {
            if let Some([element]) = type_arguments.as_deref() {
                return TypeRef::Array {
                    element: Box::new(element.clone()),
                };
            }
        }

        let source_module = self.reference_source_module(&name);
        TypeRef::Reference {
            name,
            target_id: None,
            source_module,
            type_arguments,
        }
    }

    pub(super) fn reference_source_module(&self, reference_name: &str) -> Option<String> {
        reference_source_module(reference_name, self.ctx)
    }
}
