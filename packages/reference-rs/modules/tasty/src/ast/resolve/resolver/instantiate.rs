//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use std::collections::BTreeMap;

use super::Resolver;
use crate::ast::model::SymbolShell;
use crate::model::{TemplateLiteralPart, TsTypeParameter, TupleElement, TypeOperatorKind, TypeRef};
use crate::shared::type_ref_map::{map_type_ref, TypeRefMap};

impl<'a> Resolver<'a> {
    pub(super) fn instantiate_symbol_type_alias(
        &self,
        symbol: &SymbolShell,
        underlying: &TypeRef,
        type_arguments: Option<&[TypeRef]>,
    ) -> TypeRef {
        let substitutions = self.build_type_substitutions(&symbol.type_parameters, type_arguments);
        if substitutions.is_empty() {
            return underlying.clone();
        }

        self.instantiate_type_ref(underlying, &substitutions)
    }

    fn build_type_substitutions(
        &self,
        type_parameters: &[TsTypeParameter],
        type_arguments: Option<&[TypeRef]>,
    ) -> BTreeMap<String, TypeRef> {
        let resolved_arguments = type_arguments.unwrap_or(&[]);
        let mut substitutions = BTreeMap::new();

        for (index, parameter) in type_parameters.iter().enumerate() {
            let argument = match resolved_arguments.get(index) {
                Some(argument) => argument.clone(),
                None => self
                    .default_argument(type_parameters, index, &substitutions)
                    .unwrap_or_else(|| unsupplied_parameter(&parameter.name)),
            };
            substitutions.insert(parameter.name.clone(), argument);
        }

        substitutions
    }

    /// The default of `type_parameters[index]`, evaluated where the parameters before it hold their arguments
    /// (`earlier`). The names from `index` on stay unbound, so no outer symbol captures a forward reference, and
    /// only a name left over after substitution resolves in the outer scope.
    fn default_argument(
        &self,
        type_parameters: &[TsTypeParameter],
        index: usize,
        earlier: &BTreeMap<String, TypeRef>,
    ) -> Option<TypeRef> {
        let default = type_parameters.get(index)?.default.clone()?;
        let mut scope = earlier.clone();
        for later in &type_parameters[index..] {
            scope
                .entry(later.name.clone())
                .or_insert_with(|| unsupplied_parameter(&later.name));
        }
        let instantiated = self.instantiate_type_ref(&default, &scope);
        Some(self.resolve_type_ref(instantiated))
    }

    fn instantiate_type_ref(
        &self,
        type_ref: &TypeRef,
        substitutions: &BTreeMap<String, TypeRef>,
    ) -> TypeRef {
        let mut mapper = InstantiateTypeRefMap { substitutions };
        map_type_ref(&mut mapper, type_ref.clone())
    }
}

/// A parameter the expansion does not supply names no symbol. It stays a type-parameter reference, so the
/// resolver never attaches a same-named top-level symbol to it.
fn unsupplied_parameter(name: &str) -> TypeRef {
    TypeRef::Reference {
        name: name.to_string(),
        target_id: None,
        source_module: None,
        type_arguments: None,
        type_parameter: true,
    }
}

struct InstantiateTypeRefMap<'a> {
    substitutions: &'a BTreeMap<String, TypeRef>,
}

impl TypeRefMap for InstantiateTypeRefMap<'_> {
    fn map_reference(
        &mut self,
        name: String,
        target_id: Option<String>,
        source_module: Option<String>,
        type_arguments: Option<Vec<TypeRef>>,
        type_parameter: bool,
    ) -> TypeRef {
        // Expansion instantiates a shell's underlying type, where the alias's own parameters are not bound
        // yet, so an unbound name matching one is that parameter. Its source module does not matter: a
        // library alias's references carry the module, and an inner binder's reference is flagged instead.
        if target_id.is_none() && !type_parameter {
            if let Some(substitution) = self.substitutions.get(&name) {
                return substitution.clone();
            }
        }

        TypeRef::Reference {
            name,
            target_id,
            source_module,
            type_arguments: type_arguments
                .map(|args| args.into_iter().map(|t| map_type_ref(self, t)).collect()),
            type_parameter,
        }
    }

    fn map_indexed_access(
        &mut self,
        object: TypeRef,
        index: TypeRef,
        resolved: Option<Box<TypeRef>>,
    ) -> TypeRef {
        TypeRef::IndexedAccess {
            object: Box::new(object),
            index: Box::new(index),
            resolved,
        }
    }

    fn map_type_operator(
        &mut self,
        operator: TypeOperatorKind,
        target: TypeRef,
        resolved: Option<Box<TypeRef>>,
    ) -> TypeRef {
        TypeRef::TypeOperator {
            operator,
            target: Box::new(target),
            resolved,
        }
    }

    fn map_type_query(&mut self, expression: String, resolved: Option<Box<TypeRef>>) -> TypeRef {
        TypeRef::TypeQuery {
            expression,
            resolved,
        }
    }

    fn map_conditional(
        &mut self,
        check_type: TypeRef,
        extends_type: TypeRef,
        true_type: TypeRef,
        false_type: TypeRef,
        resolved: Option<Box<TypeRef>>,
    ) -> TypeRef {
        TypeRef::Conditional {
            check_type: Box::new(check_type),
            extends_type: Box::new(extends_type),
            true_type: Box::new(true_type),
            false_type: Box::new(false_type),
            resolved,
        }
    }

    fn map_template_literal(
        &mut self,
        parts: Vec<TemplateLiteralPart>,
        resolved: Option<Box<TypeRef>>,
    ) -> TypeRef {
        TypeRef::TemplateLiteral { parts, resolved }
    }

    fn map_type_parameter(&mut self, param: TsTypeParameter) -> TsTypeParameter {
        param.clone()
    }

    fn map_tuple_element(&mut self, element: TupleElement) -> TupleElement {
        TupleElement {
            element: map_type_ref(self, element.element),
            ..element
        }
    }
}
