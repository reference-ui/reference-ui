//! Oxc parsing and component extraction for styletrace analysis.

use std::collections::{BTreeSet, HashMap};
use std::fs;
use std::path::Path;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Argument, Declaration, ExportDefaultDeclarationKind, ExportNamedDeclaration, Expression,
    FormalParameter, ImportDeclarationSpecifier, ImportOrExportKind, Statement, TSType,
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};

use crate::styletrace::resolver::{collect_style_prop_names, StyleTraceError};

use super::model::{
    ComponentEdge, ExportTarget, FactoryTarget, PropBindings, TraceComponent, TraceFactory,
    TraceImport, TraceModule,
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
    let mut component_factories = HashMap::new();
    let mut factories = HashMap::new();
    let mut exports = HashMap::new();
    let mut export_all_sources = Vec::new();

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
                                    is_namespace: false,
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
                                    is_namespace: false,
                                },
                            );
                        }
                        ImportDeclarationSpecifier::ImportNamespaceSpecifier(
                            namespace_specifier,
                        ) => {
                            imports.insert(
                                namespace_specifier.local.name.to_string(),
                                TraceImport {
                                    source: source_module.clone(),
                                    imported_name: "*".to_string(),
                                    is_namespace: true,
                                },
                            );
                        }
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

                if let Some(factory) = factory_from_function_declaration(
                    function,
                    path,
                    workspace_root,
                    &source,
                    style_prop_names,
                    primitive_names,
                    &imports,
                )? {
                    factories.insert(factory.0, factory.1);
                }
            }
            Statement::VariableDeclaration(declaration) => {
                collect_variable_symbols(
                    declaration.declarations.iter(),
                    path,
                    workspace_root,
                    &source,
                    style_prop_names,
                    primitive_names,
                    &imports,
                    &mut components,
                    &mut component_factories,
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
                    &mut component_factories,
                    &mut factories,
                    &mut exports,
                )?;
            }
            Statement::ExportDefaultDeclaration(export_default) => {
                collect_export_default_declaration(
                    export_default,
                    path,
                    workspace_root,
                    &source,
                    style_prop_names,
                    primitive_names,
                    &imports,
                    &mut components,
                    &mut component_factories,
                    &mut exports,
                )?;
            }
            Statement::ExportAllDeclaration(export_all) => {
                export_all_sources.push(module_source_literal(&source, export_all.source.span()));
            }
            _ => {}
        }
    }

    Ok(TraceModule {
        components,
        component_factories,
        factories,
        exports,
        export_all_sources,
    })
}

fn collect_export_default_declaration(
    export_default: &oxc_allocator::Box<'_, oxc_ast::ast::ExportDefaultDeclaration<'_>>,
    path: &Path,
    workspace_root: &Path,
    source: &str,
    style_prop_names: &BTreeSet<String>,
    primitive_names: &BTreeSet<String>,
    imports: &HashMap<String, TraceImport>,
    components: &mut HashMap<String, TraceComponent>,
    component_factories: &mut HashMap<String, FactoryTarget>,
    exports: &mut HashMap<String, ExportTarget>,
) -> Result<(), StyleTraceError> {
    match &export_default.declaration {
        ExportDefaultDeclarationKind::FunctionDeclaration(function) => {
            let component_name = function
                .id
                .as_ref()
                .map(|id| id.name.to_string())
                .unwrap_or_else(|| "__default__".to_string());

            if let Some(component) = component_from_function_like(
                &component_name,
                function.params.items.first(),
                function.body.as_ref().map(|body| &body.statements),
                path,
                workspace_root,
                source,
                style_prop_names,
                primitive_names,
                imports,
                BTreeSet::new(),
            )? {
                components.insert(component_name.clone(), component);
                exports.insert("default".to_string(), ExportTarget::Local(component_name));
            }
        }
        ExportDefaultDeclarationKind::Identifier(identifier) => {
            let name = identifier.name.to_string();
            if components.contains_key(&name) || component_factories.contains_key(&name) {
                exports.insert("default".to_string(), ExportTarget::Local(name));
            }
        }
        ExportDefaultDeclarationKind::ArrowFunctionExpression(arrow) => {
            if let Some(component) = component_from_function_like(
                "__default__",
                arrow.params.items.first(),
                Some(&arrow.body.statements),
                path,
                workspace_root,
                source,
                style_prop_names,
                primitive_names,
                imports,
                BTreeSet::new(),
            )? {
                components.insert("__default__".to_string(), component);
                exports.insert(
                    "default".to_string(),
                    ExportTarget::Local("__default__".to_string()),
                );
            }
        }
        ExportDefaultDeclarationKind::FunctionExpression(function) => {
            if let Some(component) = component_from_function_like(
                "__default__",
                function.params.items.first(),
                function.body.as_ref().map(|body| &body.statements),
                path,
                workspace_root,
                source,
                style_prop_names,
                primitive_names,
                imports,
                BTreeSet::new(),
            )? {
                components.insert("__default__".to_string(), component);
                exports.insert(
                    "default".to_string(),
                    ExportTarget::Local("__default__".to_string()),
                );
            }
        }
        _ => {}
    }

    Ok(())
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
    component_factories: &mut HashMap<String, FactoryTarget>,
    factories: &mut HashMap<String, TraceFactory>,
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

                if let Some((name, factory)) = factory_from_function_declaration(
                    function,
                    path,
                    workspace_root,
                    source,
                    style_prop_names,
                    primitive_names,
                    imports,
                )? {
                    factories.insert(name, factory);
                }
            }
            Declaration::VariableDeclaration(declaration) => {
                collect_variable_symbols(
                    declaration.declarations.iter(),
                    path,
                    workspace_root,
                    source,
                    style_prop_names,
                    primitive_names,
                    imports,
                    components,
                    component_factories,
                )?;
                for declarator in &declaration.declarations {
                    let oxc_ast::ast::BindingPattern::BindingIdentifier(identifier) =
                        &declarator.id
                    else {
                        continue;
                    };
                    let name = identifier.name.to_string();
                    if components.contains_key(&name) || component_factories.contains_key(&name) {
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

fn collect_variable_symbols<'a, I>(
    declarators: I,
    path: &Path,
    workspace_root: &Path,
    source: &str,
    style_prop_names: &BTreeSet<String>,
    primitive_names: &BTreeSet<String>,
    imports: &HashMap<String, TraceImport>,
    components: &mut HashMap<String, TraceComponent>,
    component_factories: &mut HashMap<String, FactoryTarget>,
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
            continue;
        }

        if let Some(factory_target) = factory_target_from_expression(init, imports) {
            component_factories.insert(identifier.name.to_string(), factory_target);
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

fn factory_from_function_declaration(
    function: &oxc_allocator::Box<'_, oxc_ast::ast::Function<'_>>,
    path: &Path,
    workspace_root: &Path,
    source: &str,
    style_prop_names: &BTreeSet<String>,
    primitive_names: &BTreeSet<String>,
    imports: &HashMap<String, TraceImport>,
) -> Result<Option<(String, TraceFactory)>, StyleTraceError> {
    let Some(id) = function.id.as_ref() else {
        return Ok(None);
    };
    let Some(body) = function.body.as_ref() else {
        return Ok(None);
    };

    let mut local_components = HashMap::new();
    collect_variable_symbols(
        body.statements
            .iter()
            .filter_map(|statement| match statement {
                Statement::VariableDeclaration(declaration) => {
                    Some(declaration.declarations.iter())
                }
                _ => None,
            })
            .flatten(),
        path,
        workspace_root,
        source,
        style_prop_names,
        primitive_names,
        imports,
        &mut local_components,
        &mut HashMap::new(),
    )?;

    for statement in &body.statements {
        let Statement::ReturnStatement(return_statement) = statement else {
            continue;
        };

        let Some(argument) = return_statement.argument.as_ref() else {
            continue;
        };

        if let Expression::Identifier(identifier) = argument {
            if let Some(component) = local_components.get(identifier.name.as_str()) {
                return Ok(Some((
                    id.name.to_string(),
                    TraceFactory {
                        component: component.clone(),
                    },
                )));
            }
        }

        if let Some(component) = component_from_expression(
            "FactoryProduct",
            argument,
            path,
            workspace_root,
            source,
            style_prop_names,
            primitive_names,
            imports,
            BTreeSet::new(),
        )? {
            return Ok(Some((id.name.to_string(), TraceFactory { component })));
        }
    }

    Ok(None)
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

    let uses_style_pipeline =
        component_uses_style_pipeline(body_statements, source, imports, &bindings);

    if edges.is_empty() && !uses_style_pipeline {
        return Ok(None);
    }

    Ok(Some(TraceComponent {
        exposes_style_props: bindings.exposes_style_props(),
        uses_style_pipeline,
        edges,
    }))
}

fn factory_target_from_expression(
    expression: &Expression<'_>,
    imports: &HashMap<String, TraceImport>,
) -> Option<FactoryTarget> {
    match expression {
        Expression::CallExpression(call) => match &call.callee {
            Expression::Identifier(identifier) => imports
                .get(identifier.name.as_str())
                .map(|import_binding| FactoryTarget::Imported {
                    source: import_binding.source.clone(),
                    imported_name: import_binding.imported_name.clone(),
                })
                .or_else(|| Some(FactoryTarget::Local(identifier.name.to_string()))),
            _ => None,
        },
        Expression::ParenthesizedExpression(parenthesized) => {
            factory_target_from_expression(&parenthesized.expression, imports)
        }
        Expression::TSAsExpression(asserted) => {
            factory_target_from_expression(&asserted.expression, imports)
        }
        Expression::TSSatisfiesExpression(asserted) => {
            factory_target_from_expression(&asserted.expression, imports)
        }
        Expression::TSTypeAssertion(asserted) => {
            factory_target_from_expression(&asserted.expression, imports)
        }
        Expression::TSNonNullExpression(asserted) => {
            factory_target_from_expression(&asserted.expression, imports)
        }
        Expression::TSInstantiationExpression(instantiated) => {
            factory_target_from_expression(&instantiated.expression, imports)
        }
        _ => None,
    }
}

#[derive(Default)]
struct PipelineState {
    style_signals: BTreeSet<String>,
    class_name_bindings: BTreeSet<String>,
    uses_style_pipeline: bool,
}

fn component_uses_style_pipeline(
    body_statements: &oxc_allocator::Vec<'_, Statement<'_>>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    bindings: &PropBindings,
) -> bool {
    let mut state = PipelineState {
        style_signals: bindings
            .direct_style_bindings
            .iter()
            .chain(bindings.props_object_bindings.iter())
            .chain(bindings.spread_bindings.iter())
            .cloned()
            .collect(),
        ..PipelineState::default()
    };

    for statement in body_statements {
        walk_pipeline_statement(statement, source, imports, bindings, &mut state);
        if state.uses_style_pipeline {
            return true;
        }
    }

    state.uses_style_pipeline
}

fn walk_pipeline_statement(
    statement: &Statement<'_>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    bindings: &PropBindings,
    state: &mut PipelineState,
) {
    match statement {
        Statement::ExpressionStatement(expression) => {
            walk_pipeline_expression(&expression.expression, source, imports, bindings, state)
        }
        Statement::ReturnStatement(return_statement) => {
            if let Some(argument) = &return_statement.argument {
                walk_pipeline_expression(argument, source, imports, bindings, state);
            }
        }
        Statement::VariableDeclaration(declaration) => {
            for declarator in &declaration.declarations {
                if let Some(init) = &declarator.init {
                    walk_pipeline_expression(init, source, imports, bindings, state);
                    record_pipeline_binding(
                        slice_span(source, declarator.id.span()).trim(),
                        init,
                        imports,
                        bindings,
                        state,
                    );
                }
            }
        }
        Statement::BlockStatement(block) => {
            for nested in &block.body {
                walk_pipeline_statement(nested, source, imports, bindings, state);
            }
        }
        Statement::IfStatement(if_statement) => {
            walk_pipeline_expression(&if_statement.test, source, imports, bindings, state);
            walk_pipeline_statement(&if_statement.consequent, source, imports, bindings, state);
            if let Some(alternate) = &if_statement.alternate {
                walk_pipeline_statement(alternate, source, imports, bindings, state);
            }
        }
        Statement::SwitchStatement(switch_statement) => {
            walk_pipeline_expression(
                &switch_statement.discriminant,
                source,
                imports,
                bindings,
                state,
            );
            for case in &switch_statement.cases {
                if let Some(test) = &case.test {
                    walk_pipeline_expression(test, source, imports, bindings, state);
                }
                for nested in &case.consequent {
                    walk_pipeline_statement(nested, source, imports, bindings, state);
                }
            }
        }
        _ => {}
    }
}

fn walk_pipeline_expression(
    expression: &Expression<'_>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    bindings: &PropBindings,
    state: &mut PipelineState,
) {
    match expression {
        Expression::JSXElement(element) => {
            walk_pipeline_jsx_element(element, source, imports, bindings, state)
        }
        Expression::JSXFragment(fragment) => {
            walk_pipeline_jsx_fragment(fragment, source, imports, bindings, state)
        }
        Expression::CallExpression(call) => {
            if is_direct_style_pipeline_call(call, imports)
                && call.arguments.iter().any(|argument| match argument {
                    Argument::SpreadElement(spread) => {
                        expression_reads_style_signal(&spread.argument, bindings, state)
                    }
                    _ => expression_reads_style_signal(argument.to_expression(), bindings, state),
                })
            {
                state.uses_style_pipeline = true;
            }

            walk_pipeline_expression(&call.callee, source, imports, bindings, state);
            for argument in &call.arguments {
                match argument {
                    Argument::SpreadElement(spread) => {
                        walk_pipeline_expression(&spread.argument, source, imports, bindings, state)
                    }
                    _ => walk_pipeline_expression(
                        argument.to_expression(),
                        source,
                        imports,
                        bindings,
                        state,
                    ),
                }
            }
        }
        Expression::ConditionalExpression(conditional) => {
            walk_pipeline_expression(&conditional.test, source, imports, bindings, state);
            walk_pipeline_expression(&conditional.consequent, source, imports, bindings, state);
            walk_pipeline_expression(&conditional.alternate, source, imports, bindings, state);
        }
        Expression::LogicalExpression(logical) => {
            walk_pipeline_expression(&logical.left, source, imports, bindings, state);
            walk_pipeline_expression(&logical.right, source, imports, bindings, state);
        }
        Expression::ArrayExpression(array) => {
            for element in &array.elements {
                match element {
                    oxc_ast::ast::ArrayExpressionElement::SpreadElement(spread) => {
                        walk_pipeline_expression(&spread.argument, source, imports, bindings, state)
                    }
                    oxc_ast::ast::ArrayExpressionElement::Elision(_) => {}
                    _ => walk_pipeline_expression(
                        element.to_expression(),
                        source,
                        imports,
                        bindings,
                        state,
                    ),
                }
            }
        }
        Expression::ObjectExpression(object) => {
            for property in &object.properties {
                match property {
                    oxc_ast::ast::ObjectPropertyKind::ObjectProperty(property) => {
                        walk_pipeline_expression(&property.value, source, imports, bindings, state)
                    }
                    oxc_ast::ast::ObjectPropertyKind::SpreadProperty(spread) => {
                        walk_pipeline_expression(&spread.argument, source, imports, bindings, state)
                    }
                }
            }
        }
        Expression::ArrowFunctionExpression(arrow) => {
            for nested in &arrow.body.statements {
                walk_pipeline_statement(nested, source, imports, bindings, state);
            }
        }
        Expression::FunctionExpression(function) => {
            if let Some(body) = &function.body {
                for nested in &body.statements {
                    walk_pipeline_statement(nested, source, imports, bindings, state);
                }
            }
        }
        Expression::ParenthesizedExpression(parenthesized) => {
            walk_pipeline_expression(&parenthesized.expression, source, imports, bindings, state)
        }
        Expression::TSAsExpression(asserted) => {
            walk_pipeline_expression(&asserted.expression, source, imports, bindings, state)
        }
        Expression::TSSatisfiesExpression(asserted) => {
            walk_pipeline_expression(&asserted.expression, source, imports, bindings, state)
        }
        Expression::TSTypeAssertion(asserted) => {
            walk_pipeline_expression(&asserted.expression, source, imports, bindings, state)
        }
        Expression::TSNonNullExpression(asserted) => {
            walk_pipeline_expression(&asserted.expression, source, imports, bindings, state)
        }
        Expression::TSInstantiationExpression(instantiated) => {
            walk_pipeline_expression(&instantiated.expression, source, imports, bindings, state)
        }
        Expression::ComputedMemberExpression(member) => {
            walk_pipeline_expression(&member.object, source, imports, bindings, state);
            walk_pipeline_expression(&member.expression, source, imports, bindings, state);
        }
        Expression::StaticMemberExpression(member) => {
            walk_pipeline_expression(&member.object, source, imports, bindings, state)
        }
        _ => {}
    }
}

fn walk_pipeline_jsx_element(
    element: &oxc_allocator::Box<'_, oxc_ast::ast::JSXElement<'_>>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    bindings: &PropBindings,
    state: &mut PipelineState,
) {
    for attribute in &element.opening_element.attributes {
        match attribute {
            oxc_ast::ast::JSXAttributeItem::Attribute(attribute) => {
                let is_class_name = matches!(
                    &attribute.name,
                    oxc_ast::ast::JSXAttributeName::Identifier(identifier)
                        if identifier.name.as_str() == "className"
                );

                if is_class_name {
                    if let Some(oxc_ast::ast::JSXAttributeValue::ExpressionContainer(container)) =
                        &attribute.value
                    {
                        if !matches!(
                            &container.expression,
                            oxc_ast::ast::JSXExpression::EmptyExpression(_)
                        ) && expression_uses_class_name_binding(
                            container.expression.to_expression(),
                            state,
                        ) {
                            state.uses_style_pipeline = true;
                        }
                    }
                }

                if let Some(value) = &attribute.value {
                    match value {
                        oxc_ast::ast::JSXAttributeValue::ExpressionContainer(container) => {
                            if !matches!(
                                &container.expression,
                                oxc_ast::ast::JSXExpression::EmptyExpression(_)
                            ) {
                                walk_pipeline_expression(
                                    container.expression.to_expression(),
                                    source,
                                    imports,
                                    bindings,
                                    state,
                                );
                            }
                        }
                        oxc_ast::ast::JSXAttributeValue::Element(element) => {
                            walk_pipeline_jsx_element(element, source, imports, bindings, state)
                        }
                        oxc_ast::ast::JSXAttributeValue::Fragment(fragment) => {
                            walk_pipeline_jsx_fragment(fragment, source, imports, bindings, state)
                        }
                        oxc_ast::ast::JSXAttributeValue::StringLiteral(_) => {}
                    }
                }
            }
            oxc_ast::ast::JSXAttributeItem::SpreadAttribute(spread) => {
                walk_pipeline_expression(&spread.argument, source, imports, bindings, state)
            }
        }
    }

    for child in &element.children {
        walk_pipeline_jsx_child(child, source, imports, bindings, state);
    }
}

fn walk_pipeline_jsx_fragment(
    fragment: &oxc_allocator::Box<'_, oxc_ast::ast::JSXFragment<'_>>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    bindings: &PropBindings,
    state: &mut PipelineState,
) {
    for child in &fragment.children {
        walk_pipeline_jsx_child(child, source, imports, bindings, state);
    }
}

fn walk_pipeline_jsx_child(
    child: &oxc_ast::ast::JSXChild<'_>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    bindings: &PropBindings,
    state: &mut PipelineState,
) {
    match child {
        oxc_ast::ast::JSXChild::Element(element) => {
            walk_pipeline_jsx_element(element, source, imports, bindings, state)
        }
        oxc_ast::ast::JSXChild::Fragment(fragment) => {
            walk_pipeline_jsx_fragment(fragment, source, imports, bindings, state)
        }
        oxc_ast::ast::JSXChild::ExpressionContainer(container) => {
            if !matches!(
                &container.expression,
                oxc_ast::ast::JSXExpression::EmptyExpression(_)
            ) {
                walk_pipeline_expression(
                    container.expression.to_expression(),
                    source,
                    imports,
                    bindings,
                    state,
                );
            }
        }
        oxc_ast::ast::JSXChild::Spread(spread) => {
            walk_pipeline_expression(&spread.expression, source, imports, bindings, state)
        }
        oxc_ast::ast::JSXChild::Text(_) => {}
    }
}

fn record_pipeline_binding(
    pattern_source: &str,
    init: &Expression<'_>,
    imports: &HashMap<String, TraceImport>,
    bindings: &PropBindings,
    state: &mut PipelineState,
) {
    let init_uses_style_signal = expression_reads_style_signal(init, bindings, state)
        || matches!(init, Expression::CallExpression(call) if call_has_style_signal_arg(call, bindings, state));

    if pattern_source.starts_with('{') && init_uses_style_signal {
        for binding in parse_object_pattern_bindings(pattern_source) {
            state.style_signals.insert(binding.local_name);
        }
        if let Some(rest_binding) = parse_object_pattern_rest(pattern_source) {
            state.style_signals.insert(rest_binding);
        }
        return;
    }

    if pattern_source.starts_with('[')
        && matches!(init, Expression::CallExpression(call) if is_split_css_props_call(call, imports))
        && expression_reads_style_signal(call_first_argument(init), bindings, state)
    {
        if let Some(first_binding) = parse_array_pattern_first_binding(pattern_source) {
            state.style_signals.insert(first_binding);
        }
        return;
    }

    if is_identifier(pattern_source) {
        if pattern_source.to_ascii_lowercase().contains("class")
            && matches!(init, Expression::CallExpression(call) if call_has_style_signal_arg(call, bindings, state))
        {
            state.class_name_bindings.insert(pattern_source.to_string());
        }

        if expression_directly_derives_from_style_signal(init, bindings, state) {
            state.style_signals.insert(pattern_source.to_string());
        }
    }
}

fn parse_array_pattern_first_binding(pattern_source: &str) -> Option<String> {
    let inner = pattern_source
        .trim()
        .strip_prefix('[')
        .and_then(|value| value.strip_suffix(']'))
        .unwrap_or("");

    inner
        .split(',')
        .next()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned)
}

fn call_first_argument<'a>(expression: &'a Expression<'a>) -> &'a Expression<'a> {
    match expression {
        Expression::CallExpression(call) => call
            .arguments
            .iter()
            .find_map(|argument| match argument {
                Argument::SpreadElement(spread) => Some(&spread.argument),
                _ => Some(argument.to_expression()),
            })
            .expect("expected call expression to have an argument"),
        _ => expression,
    }
}

fn expression_reads_style_signal(
    expression: &Expression<'_>,
    bindings: &PropBindings,
    state: &PipelineState,
) -> bool {
    match expression {
        Expression::Identifier(identifier) => {
            bindings.expression_reads_style_prop(expression)
                || state.style_signals.contains(identifier.name.as_str())
        }
        Expression::StaticMemberExpression(member) => {
            if let Expression::Identifier(identifier) = &member.object {
                return bindings.expression_reads_style_prop(expression)
                    || state.style_signals.contains(identifier.name.as_str());
            }
            expression_reads_style_signal(&member.object, bindings, state)
        }
        Expression::ComputedMemberExpression(member) => {
            expression_reads_style_signal(&member.object, bindings, state)
                || expression_reads_style_signal(&member.expression, bindings, state)
        }
        Expression::ParenthesizedExpression(parenthesized) => {
            expression_reads_style_signal(&parenthesized.expression, bindings, state)
        }
        Expression::TSAsExpression(asserted) => {
            expression_reads_style_signal(&asserted.expression, bindings, state)
        }
        Expression::TSSatisfiesExpression(asserted) => {
            expression_reads_style_signal(&asserted.expression, bindings, state)
        }
        Expression::TSTypeAssertion(asserted) => {
            expression_reads_style_signal(&asserted.expression, bindings, state)
        }
        Expression::TSNonNullExpression(asserted) => {
            expression_reads_style_signal(&asserted.expression, bindings, state)
        }
        _ => false,
    }
}

fn expression_directly_derives_from_style_signal(
    expression: &Expression<'_>,
    bindings: &PropBindings,
    state: &PipelineState,
) -> bool {
    match expression {
        Expression::Identifier(_)
        | Expression::StaticMemberExpression(_)
        | Expression::ComputedMemberExpression(_)
        | Expression::ParenthesizedExpression(_)
        | Expression::TSAsExpression(_)
        | Expression::TSSatisfiesExpression(_)
        | Expression::TSTypeAssertion(_)
        | Expression::TSNonNullExpression(_) => {
            expression_reads_style_signal(expression, bindings, state)
        }
        _ => false,
    }
}

fn expression_uses_class_name_binding(expression: &Expression<'_>, state: &PipelineState) -> bool {
    match expression {
        Expression::Identifier(identifier) => {
            state.class_name_bindings.contains(identifier.name.as_str())
        }
        Expression::ParenthesizedExpression(parenthesized) => {
            expression_uses_class_name_binding(&parenthesized.expression, state)
        }
        Expression::TSAsExpression(asserted) => {
            expression_uses_class_name_binding(&asserted.expression, state)
        }
        Expression::TSSatisfiesExpression(asserted) => {
            expression_uses_class_name_binding(&asserted.expression, state)
        }
        Expression::TSTypeAssertion(asserted) => {
            expression_uses_class_name_binding(&asserted.expression, state)
        }
        Expression::TSNonNullExpression(asserted) => {
            expression_uses_class_name_binding(&asserted.expression, state)
        }
        _ => false,
    }
}

fn call_has_style_signal_arg(
    call: &oxc_ast::ast::CallExpression<'_>,
    bindings: &PropBindings,
    state: &PipelineState,
) -> bool {
    call.arguments.iter().any(|argument| match argument {
        Argument::SpreadElement(spread) => {
            expression_reads_style_signal(&spread.argument, bindings, state)
        }
        _ => expression_reads_style_signal(argument.to_expression(), bindings, state),
    })
}

fn is_direct_style_pipeline_call(
    call: &oxc_ast::ast::CallExpression<'_>,
    imports: &HashMap<String, TraceImport>,
) -> bool {
    if is_split_css_props_call(call, imports) {
        return true;
    }

    let Expression::Identifier(identifier) = &call.callee else {
        return false;
    };

    match imports.get(identifier.name.as_str()) {
        Some(import_binding)
            if import_binding.source == "@reference-ui/styled/css"
                && import_binding.imported_name == "css" =>
        {
            true
        }
        Some(import_binding)
            if import_binding.source.contains("/patterns/box")
                && import_binding.imported_name == "box" =>
        {
            true
        }
        _ => matches!(identifier.name.as_str(), "css" | "box" | "splitCssProps"),
    }
}

fn is_split_css_props_call(
    call: &oxc_ast::ast::CallExpression<'_>,
    imports: &HashMap<String, TraceImport>,
) -> bool {
    let Expression::Identifier(identifier) = &call.callee else {
        return false;
    };

    match imports.get(identifier.name.as_str()) {
        Some(import_binding)
            if import_binding.source == "@reference-ui/styled/jsx"
                && import_binding.imported_name == "splitCssProps" =>
        {
            true
        }
        _ => identifier.name.as_str() == "splitCssProps",
    }
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
