//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use oxc_span::GetSpan;

use crate::model::TypeRef;
use crate::shared::type_ref_util::reference_lookup_name;

use super::super::namespaces::expand_alias;
use super::super::slice_span;
use super::LoweringContext;
use super::{bound_reference, reference_source_module};

impl<'a> LoweringContext<'a> {
    /// The name a reference lowers to: an import-equals alias expands to its target text, unless a bound name shadows it.
    fn expand_reference(&self, name: String) -> String {
        if self.is_bound(&name) {
            return name;
        }
        expand_alias(self.ctx.import_bindings, &name)
    }

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
        let name = self
            .expand_reference(slice_span(self.ctx.source, reference.type_name.span()).to_string());
        let lookup_name = reference_lookup_name(&name);
        let type_arguments = reference.type_arguments.as_ref().map(|instantiation| {
            instantiation
                .params
                .iter()
                .map(|argument| self.lower_type(argument))
                .collect::<Vec<_>>()
        });

        if self.is_bound(&name) {
            return bound_reference(name, type_arguments, self.ctx);
        }

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
            type_parameter: false,
        }
    }

    /// `TSInterfaceHeritage` splits `extends Foo<A, B>` into `expression` (`Foo`) and `type_arguments`.
    /// Lower both so built-ins like `Omit` and `Array` keep their type arguments. Even `Array<T>` stays a
    /// reference, so its element is a dependency the same way any other heritage argument is.
    pub(super) fn lower_interface_heritage(
        &self,
        heritage: &oxc_ast::ast::TSInterfaceHeritage<'_>,
    ) -> TypeRef {
        let name = self
            .expand_reference(slice_span(self.ctx.source, heritage.expression.span()).to_string());
        let type_arguments = heritage.type_arguments.as_ref().map(|instantiation| {
            instantiation
                .params
                .iter()
                .map(|argument| self.lower_type(argument))
                .collect::<Vec<_>>()
        });

        let source_module = self.reference_source_module(&name);
        TypeRef::Reference {
            name,
            target_id: None,
            source_module,
            type_arguments,
            type_parameter: false,
        }
    }

    pub(super) fn reference_source_module(&self, reference_name: &str) -> Option<String> {
        reference_source_module(reference_name, self.ctx)
    }
}
