//! Oxc parsing and component extraction for styletrace analysis.

use std::collections::{BTreeSet, HashMap};
use std::fs;
use std::path::Path;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Argument, Declaration, ExportNamedDeclaration, Expression, FormalParameter,
    ImportDeclarationSpecifier, ImportOrExportKind, Statement, TSType,
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};

use crate::styletrace::resolver::{collect_style_prop_names, StyleTraceError};

use super::model::{
    ComponentEdge, ExportTarget, PropBindings, TraceComponent, TraceImport, TraceModule,
};
use super::util::{
    is_component_name, is_identifier, module_export_name, module_source_literal,
    parse_object_pattern_bindings, parse_object_pattern_rest, slice_span,
};
use super::walk::collect_edges_from_statement;

pub(super) fn parse_trace_module(
    path: &Path,
    workspace_root: &Path,
    style_prop_names: &BTreeSet<String>,
    primitive_names: &BTreeSet<String>,
) -> Result<TraceModule, StyleTraceError> {
    let source = fs::read_to_string(path).map_err(|error| {
        StyleTraceError::new(format!("failed to read {}: {error}", path.display()))
    })?;

    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parsed = Parser::new(&allocator, &source, source_type).parse();
    if !parsed.errors.is_empty() {
        return Err(StyleTraceError::new(format!(
            "failed to parse {}: {} parse error(s)",
            path.display(),
            parsed.errors.len()
        )));
    }

    let mut imports = HashMap::new();
    let mut components = HashMap::new();
    let mut exports = HashMap::new();

    for statement in &parsed.program.body {
        match statement {
            Statement::ImportDeclaration(import_decl) => {
                let source_module = module_source_literal(&source, import_decl.source.span());

                let Some(specifiers) = &import_decl.specifiers else {
                    continue;
                };

                for specifier in specifiers {
                    match specifier {
                        ImportDeclarationSpecifier::ImportSpecifier(named) => {
                            imports.insert(
                                named.local.name.to_string(),
                                TraceImport {
                                    source: source_module.clone(),
                                    imported_name: module_export_name(&source, &named.imported),
                                },
                            );
                        }
                        ImportDeclarationSpecifier::ImportDefaultSpecifier(default_specifier) => {
                            if import_decl.import_kind == ImportOrExportKind::Type {
                                continue;
                            }

                            imports.insert(
                                default_specifier.local.name.to_string(),
                                TraceImport {
                                    source: source_module.clone(),
                                    imported_name: "default".to_string(),
                                },
                            );
                        }
                        ImportDeclarationSpecifier::ImportNamespaceSpecifier(_) => {}
                    }
                }
            }
            Statement::FunctionDeclaration(function) => {
                if let Some(component) = component_from_function_declaration(
                    function,
                    path,
                    workspace_root,
                    &source,
                    style_prop_names,
                    primitive_names,
                    &imports,
                )? {
                    components.insert(component.0, component.1);
                }
            }
            Statement::VariableDeclaration(declaration) => {
                collect_variable_components(
                    declaration.declarations.iter(),
                    path,
                    workspace_root,
                    &source,
                    style_prop_names,
                    primitive_names,
                    &imports,
                    &mut components,
                )?;
            }
            Statement::ExportNamedDeclaration(export_decl) => {
                collect_export_named_declaration(
                    export_decl,
                    path,
                    workspace_root,
                    &source,
                    style_prop_names,
                    primitive_names,
                    &imports,
                    &mut components,
                    &mut exports,
                )?;
            }
            _ => {}
        }
    }

    Ok(TraceModule {
        components,
        exports,
    })
}

fn collect_export_named_declaration(
    export_decl: &oxc_allocator::Box<'_, ExportNamedDeclaration<'_>>,
    path: &Path,
    workspace_root: &Path,
    source: &str,
    style_prop_names: &BTreeSet<String>,
    primitive_names: &BTreeSet<String>,
    imports: &HashMap<String, TraceImport>,
    components: &mut HashMap<String, TraceComponent>,
    exports: &mut HashMap<String, ExportTarget>,
) -> Result<(), StyleTraceError> {
    if let Some(declaration) = export_decl.declaration.as_ref() {
        match declaration {
            Declaration::FunctionDeclaration(function) => {
                if let Some((name, component)) = component_from_function_declaration(
                    function,
                    path,
                    workspace_root,
                    source,
                    style_prop_names,
                    primitive_names,
                    imports,
                )? {
                    components.insert(name.clone(), component);
                    exports.insert(name.clone(), ExportTarget::Local(name));
                }
            }
            Declaration::VariableDeclaration(declaration) => {
                collect_variable_components(
                    declaration.declarations.iter(),
                    path,
                    workspace_root,
                    source,
                    style_prop_names,
                    primitive_names,
                    imports,
                    components,
                )?;
                for declarator in &declaration.declarations {
                    let oxc_ast::ast::BindingPattern::BindingIdentifier(identifier) =
                        &declarator.id
                    else {
                        continue;
                    };
                    let name = identifier.name.to_string();
                    if components.contains_key(&name) {
                        exports.insert(name.clone(), ExportTarget::Local(name));
                    }
                }
            }
            _ => {}
        }
        return Ok(());
    }

    let source_module = export_decl
        .source
        .as_ref()
        .map(|value| module_source_literal(source, value.span()));

    for specifier in &export_decl.specifiers {
        let local = module_export_name(source, &specifier.local);
        let exported = module_export_name(source, &specifier.exported);

        if let Some(source_module) = &source_module {
            exports.insert(
                exported,
                ExportTarget::Imported {
                    source: source_module.clone(),
                    imported_name: local,
                },
            );
            continue;
        }

        if components.contains_key(&local) {
            exports.insert(exported, ExportTarget::Local(local));
            continue;
        }

        if let Some(import_binding) = imports.get(&local) {
            exports.insert(
                exported,
                ExportTarget::Imported {
                    source: import_binding.source.clone(),
                    imported_name: import_binding.imported_name.clone(),
                },
            );
        }
    }

    Ok(())
}

fn collect_variable_components<'a, I>(
    declarators: I,
    path: &Path,
    workspace_root: &Path,
    source: &str,
    style_prop_names: &BTreeSet<String>,
    primitive_names: &BTreeSet<String>,
    imports: &HashMap<String, TraceImport>,
    components: &mut HashMap<String, TraceComponent>,
) -> Result<(), StyleTraceError>
where
    I: IntoIterator<Item = &'a oxc_ast::ast::VariableDeclarator<'a>>,
{
    for declarator in declarators {
        let oxc_ast::ast::BindingPattern::BindingIdentifier(identifier) = &declarator.id else {
            continue;
        };
        let Some(init) = declarator.init.as_ref() else {
            continue;
        };
        if let Some(component) = component_from_expression(
            &identifier.name.to_string(),
            init,
            path,
            workspace_root,
            source,
            style_prop_names,
            primitive_names,
            imports,
            BTreeSet::new(),
        )? {
            components.insert(identifier.name.to_string(), component);
        }
    }

    Ok(())
}

fn component_from_function_declaration(
    function: &oxc_allocator::Box<'_, oxc_ast::ast::Function<'_>>,
    path: &Path,
    workspace_root: &Path,
    source: &str,
    style_prop_names: &BTreeSet<String>,
    primitive_names: &BTreeSet<String>,
    imports: &HashMap<String, TraceImport>,
) -> Result<Option<(String, TraceComponent)>, StyleTraceError> {
    let Some(id) = function.id.as_ref() else {
        return Ok(None);
    };

    let name = id.name.to_string();
    let component = component_from_function_like(
        &name,
        function.params.items.first(),
        function.body.as_ref().map(|body| &body.statements),
        path,
        workspace_root,
        source,
        style_prop_names,
        primitive_names,
        imports,
        BTreeSet::new(),
    )?;

    Ok(component.map(|component| (name, component)))
}

fn component_from_expression(
    name: &str,
    expression: &Expression<'_>,
    path: &Path,
    workspace_root: &Path,
    source: &str,
    style_prop_names: &BTreeSet<String>,
    primitive_names: &BTreeSet<String>,
    imports: &HashMap<String, TraceImport>,
    wrapper_style_props: BTreeSet<String>,
) -> Result<Option<TraceComponent>, StyleTraceError> {
    match expression {
        Expression::ArrowFunctionExpression(arrow) => component_from_function_like(
            name,
            arrow.params.items.first(),
            Some(&arrow.body.statements),
            path,
            workspace_root,
            source,
            style_prop_names,
            primitive_names,
            imports,
            wrapper_style_props,
        ),
        Expression::FunctionExpression(function) => component_from_function_like(
            name,
            function.params.items.first(),
            function.body.as_ref().map(|body| &body.statements),
            path,
            workspace_root,
            source,
            style_prop_names,
            primitive_names,
            imports,
            wrapper_style_props,
        ),
        Expression::ParenthesizedExpression(parenthesized) => component_from_expression(
            name,
            &parenthesized.expression,
            path,
            workspace_root,
            source,
            style_prop_names,
            primitive_names,
            imports,
            wrapper_style_props,
        ),
        Expression::TSAsExpression(asserted) => component_from_expression(
            name,
            &asserted.expression,
            path,
            workspace_root,
            source,
            style_prop_names,
            primitive_names,
            imports,
            wrapper_style_props,
        ),
        Expression::TSSatisfiesExpression(asserted) => component_from_expression(
            name,
            &asserted.expression,
            path,
            workspace_root,
            source,
            style_prop_names,
            primitive_names,
            imports,
            wrapper_style_props,
        ),
        Expression::TSTypeAssertion(asserted) => component_from_expression(
            name,
            &asserted.expression,
            path,
            workspace_root,
            source,
            style_prop_names,
            primitive_names,
            imports,
            wrapper_style_props,
        ),
        Expression::TSNonNullExpression(asserted) => component_from_expression(
            name,
            &asserted.expression,
            path,
            workspace_root,
            source,
            style_prop_names,
            primitive_names,
            imports,
            wrapper_style_props,
        ),
        Expression::TSInstantiationExpression(instantiated) => {
            let next_wrapper = wrapper_style_props_from_type_arguments(
                path,
                workspace_root,
                source,
                instantiated.type_arguments.params.iter().nth(1),
                style_prop_names,
            )?;
            component_from_expression(
                name,
                &instantiated.expression,
                path,
                workspace_root,
                source,
                style_prop_names,
                primitive_names,
                imports,
                next_wrapper,
            )
        }
        Expression::CallExpression(call) => {
            let next_wrapper = wrapper_style_props_from_call(
                call,
                path,
                workspace_root,
                source,
                style_prop_names,
            )?;
            for argument in &call.arguments {
                let Argument::SpreadElement(_) = argument else {
                    if let Some(component) = component_from_expression(
                        name,
                        argument.to_expression(),
                        path,
                        workspace_root,
                        source,
                        style_prop_names,
                        primitive_names,
                        imports,
                        next_wrapper.clone(),
                    )? {
                        return Ok(Some(component));
                    }
                    continue;
                };
            }
            Ok(None)
        }
        _ => Ok(None),
    }
}

fn component_from_function_like(
    name: &str,
    first_param: Option<&FormalParameter<'_>>,
    body_statements: Option<&oxc_allocator::Vec<'_, Statement<'_>>>,
    path: &Path,
    workspace_root: &Path,
    source: &str,
    style_prop_names: &BTreeSet<String>,
    primitive_names: &BTreeSet<String>,
    imports: &HashMap<String, TraceImport>,
    wrapper_style_props: BTreeSet<String>,
) -> Result<Option<TraceComponent>, StyleTraceError> {
    if !is_component_name(name) {
        return Ok(None);
    }
    let Some(body_statements) = body_statements else {
        return Ok(None);
    };

    let bindings = parse_prop_bindings(
        first_param,
        path,
        workspace_root,
        source,
        style_prop_names,
        wrapper_style_props,
    )?;
    let mut edges = Vec::<ComponentEdge>::new();
    for statement in body_statements {
        collect_edges_from_statement(
            statement,
            source,
            imports,
            primitive_names,
            &bindings,
            &mut edges,
        );
    }

    if edges.is_empty() {
        return Ok(None);
    }

    Ok(Some(TraceComponent {
        exposes_style_props: bindings.exposes_style_props(),
        edges,
    }))
}

fn parse_prop_bindings(
    first_param: Option<&FormalParameter<'_>>,
    path: &Path,
    workspace_root: &Path,
    source: &str,
    style_prop_names: &BTreeSet<String>,
    wrapper_style_props: BTreeSet<String>,
) -> Result<PropBindings, StyleTraceError> {
    let Some(param) = first_param else {
        return Ok(PropBindings::default());
    };

    let mut resolved_style_props = if wrapper_style_props.is_empty() {
        BTreeSet::new()
    } else {
        wrapper_style_props
    };

    if let Some(annotation) = param.type_annotation.as_ref() {
        resolved_style_props.extend(resolve_style_props_from_type_annotation(
            path,
            workspace_root,
            source,
            &annotation.type_annotation,
            style_prop_names,
        )?);
    }

    let mut bindings = PropBindings::default();
    let pattern_source = slice_span(source, param.pattern.span()).trim();
    if pattern_source.starts_with('{') {
        let destructured = parse_object_pattern_bindings(pattern_source);
        let explicit_style_props = destructured
            .iter()
            .filter(|binding| resolved_style_props.contains(&binding.prop_name))
            .map(|binding| binding.local_name.clone())
            .collect::<BTreeSet<_>>();

        if explicit_style_props.is_empty() {
            for binding in &destructured {
                if style_prop_names.contains(&binding.prop_name) {
                    bindings
                        .direct_style_bindings
                        .insert(binding.local_name.clone());
                }
            }
        } else {
            bindings.direct_style_bindings.extend(explicit_style_props);
        }

        if let Some(rest_binding) = parse_object_pattern_rest(pattern_source) {
            let explicitly_named_props = destructured
                .iter()
                .map(|binding| binding.prop_name.clone())
                .collect::<BTreeSet<_>>();
            if resolved_style_props
                .iter()
                .any(|name| !explicitly_named_props.contains(name))
            {
                bindings.spread_bindings.insert(rest_binding);
            }
        }

        return Ok(bindings);
    }

    if is_identifier(pattern_source) && !resolved_style_props.is_empty() {
        bindings
            .props_object_bindings
            .insert(pattern_source.to_string());
        bindings.spread_bindings.insert(pattern_source.to_string());
    }

    Ok(bindings)
}

fn wrapper_style_props_from_call(
    call: &oxc_ast::ast::CallExpression<'_>,
    path: &Path,
    workspace_root: &Path,
    source: &str,
    style_prop_names: &BTreeSet<String>,
) -> Result<BTreeSet<String>, StyleTraceError> {
    wrapper_style_props_from_type_arguments(
        path,
        workspace_root,
        source,
        call.type_arguments
            .as_ref()
            .and_then(|instantiation| instantiation.params.iter().nth(1)),
        style_prop_names,
    )
}

fn wrapper_style_props_from_type_arguments(
    path: &Path,
    workspace_root: &Path,
    source: &str,
    ts_type: Option<&TSType<'_>>,
    style_prop_names: &BTreeSet<String>,
) -> Result<BTreeSet<String>, StyleTraceError> {
    match ts_type {
        Some(ts_type) => resolve_style_props_from_type_annotation(
            path,
            workspace_root,
            source,
            ts_type,
            style_prop_names,
        ),
        None => Ok(BTreeSet::new()),
    }
}

fn resolve_style_props_from_type_annotation(
    path: &Path,
    workspace_root: &Path,
    source: &str,
    type_annotation: &TSType<'_>,
    style_prop_names: &BTreeSet<String>,
) -> Result<BTreeSet<String>, StyleTraceError> {
    match type_annotation {
        TSType::TSTypeReference(reference) => Ok(collect_style_prop_names(
            workspace_root,
            path,
            slice_span(source, reference.type_name.span()),
        )?
        .into_iter()
        .filter(|name| style_prop_names.contains(name))
        .collect()),
        TSType::TSTypeLiteral(type_literal) => Ok(type_literal
            .members
            .iter()
            .filter_map(|member| match member {
                oxc_ast::ast::TSSignature::TSPropertySignature(property) => {
                    let name = slice_span(source, property.key.span())
                        .trim_matches('"')
                        .trim_matches('\'');
                    style_prop_names.contains(name).then(|| name.to_string())
                }
                _ => None,
            })
            .collect()),
        TSType::TSIntersectionType(intersection) => {
            let mut names = BTreeSet::new();
            for nested in &intersection.types {
                names.extend(resolve_style_props_from_type_annotation(
                    path,
                    workspace_root,
                    source,
                    nested,
                    style_prop_names,
                )?);
            }
            Ok(names)
        }
        TSType::TSParenthesizedType(parenthesized) => resolve_style_props_from_type_annotation(
            path,
            workspace_root,
            source,
            &parenthesized.type_annotation,
            style_prop_names,
        ),
        _ => Ok(BTreeSet::new()),
    }
}
