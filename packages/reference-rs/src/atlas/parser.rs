use crate::atlas::internal::{
    ComponentDecl, ImportBinding, ImportKind, ModuleInfo, PropDef, PropValueType,
    PropsAnnotation, ReExport, TypeDef, TypeExpr,
};
use crate::atlas::scanner::SourceFile;
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Argument, BindingPattern, Declaration, ExportDefaultDeclarationKind, Expression,
    FormalParameter, ImportDeclarationSpecifier, ImportOrExportKind, ModuleExportName,
    PropertyKey, Statement, TSLiteral, TSSignature, TSType,
};
use oxc_parser::Parser;
use oxc_span::GetSpan;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

pub fn parse_modules(
    source_files: &[SourceFile],
    app_root: Option<&Path>,
    package_name: Option<&str>,
) -> HashMap<PathBuf, ModuleInfo> {
    source_files
        .iter()
        .map(|source_file| {
            let display_source = package_name
                .map(|name| name.to_string())
                .unwrap_or_else(|| local_source_display(app_root.unwrap(), &source_file.path));
            let app_relative_path = app_root
                .and_then(|root| source_file.path.strip_prefix(root).ok())
                .map(path_to_posix);

            (
                source_file.path.clone(),
                parse_module(source_file, &display_source, app_relative_path),
            )
        })
        .collect()
}

fn parse_module(
    source_file: &SourceFile,
    display_source: &str,
    app_relative_path: Option<String>,
) -> ModuleInfo {
    let allocator = Allocator::default();
    let parsed = Parser::new(&allocator, &source_file.content, source_file.source_type).parse();
    let mut state = ModuleParseState::default();
    let default_name = default_export_name(&source_file.path);

    for statement in parsed.program.body.iter() {
        collect_statement(
            statement,
            &source_file.path,
            display_source,
            app_relative_path.as_ref(),
            &source_file.content,
            &default_name,
            &mut state,
        );
    }

    let namespace_imports = state
        .imports
        .values()
        .filter(|binding| binding.kind == ImportKind::Namespace)
        .map(|binding| (binding.local.clone(), binding.source.clone()))
        .collect::<HashMap<_, _>>();

    ModuleInfo {
        path: source_file.path.clone(),
        content: source_file.content.clone(),
        display_source: display_source.to_string(),
        imports: state.imports,
        namespace_imports,
        components: state.exported_components,
        default_component: state.default_component,
        named_component_reexports: state.named_component_reexports,
        types: state.types,
        named_type_reexports: state.named_type_reexports,
    }
}

#[derive(Default)]
struct ModuleParseState {
    imports: HashMap<String, ImportBinding>,
    local_components: HashMap<String, ComponentDecl>,
    exported_components: HashMap<String, ComponentDecl>,
    default_component: Option<String>,
    named_component_reexports: HashMap<String, ReExport>,
    types: HashMap<String, TypeDef>,
    named_type_reexports: HashMap<String, ReExport>,
}

fn collect_statement(
    statement: &Statement<'_>,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
    default_name: &str,
    state: &mut ModuleParseState,
) {
    match statement {
        Statement::ImportDeclaration(import_decl) => collect_imports(import_decl, state, source),
        Statement::FunctionDeclaration(function) => {
            if let Some(component) = component_from_function_declaration(
                function,
                file_path,
                display_source,
                app_relative_path,
                source,
            ) {
                state.local_components.insert(component.name.clone(), component);
            }
        }
        Statement::VariableDeclaration(declaration) => collect_variable_components(
            declaration.declarations.iter(),
            file_path,
            display_source,
            app_relative_path,
            source,
            state,
            false,
        ),
        Statement::TSInterfaceDeclaration(interface_decl) => {
            state.types.insert(
                interface_decl.id.name.to_string(),
                TypeDef {
                    expr: type_expr_from_interface(interface_decl, source),
                },
            );
        }
        Statement::TSTypeAliasDeclaration(type_alias) => {
            state.types.insert(
                type_alias.id.name.to_string(),
                TypeDef {
                    expr: type_expr_from_type(&type_alias.type_annotation, source),
                },
            );
        }
        Statement::ExportNamedDeclaration(export_decl) => collect_export_named_declaration(
            export_decl,
            file_path,
            display_source,
            app_relative_path,
            source,
            state,
        ),
        Statement::ExportDefaultDeclaration(export_default) => collect_default_export(
            export_default,
            file_path,
            display_source,
            app_relative_path,
            source,
            default_name,
            state,
        ),
        _ => {}
    }
}

fn collect_imports(
    import_decl: &oxc_allocator::Box<'_, oxc_ast::ast::ImportDeclaration<'_>>,
    state: &mut ModuleParseState,
    source: &str,
) {
    let source_module = unquote(slice_span(source, import_decl.source.span));
    let Some(specifiers) = &import_decl.specifiers else {
        return;
    };

    for specifier in specifiers {
        match specifier {
            ImportDeclarationSpecifier::ImportSpecifier(named) => {
                let local = named.local.name.to_string();
                state.imports.insert(
                    local.clone(),
                    ImportBinding {
                        source: source_module.clone(),
                        local,
                        imported: Some(module_export_name_to_string(&named.imported)),
                        kind: ImportKind::Named,
                        is_type: named.import_kind == ImportOrExportKind::Type,
                    },
                );
            }
            ImportDeclarationSpecifier::ImportDefaultSpecifier(default_specifier) => {
                let local = default_specifier.local.name.to_string();
                state.imports.insert(
                    local.clone(),
                    ImportBinding {
                        source: source_module.clone(),
                        local,
                        imported: Some("default".to_string()),
                        kind: ImportKind::Default,
                        is_type: import_decl.import_kind == ImportOrExportKind::Type,
                    },
                );
            }
            ImportDeclarationSpecifier::ImportNamespaceSpecifier(namespace_specifier) => {
                let local = namespace_specifier.local.name.to_string();
                state.imports.insert(
                    local.clone(),
                    ImportBinding {
                        source: source_module.clone(),
                        local,
                        imported: None,
                        kind: ImportKind::Namespace,
                        is_type: false,
                    },
                );
            }
        }
    }
}

fn collect_export_named_declaration(
    export_decl: &oxc_allocator::Box<'_, oxc_ast::ast::ExportNamedDeclaration<'_>>,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
    state: &mut ModuleParseState,
) {
    if let Some(declaration) = export_decl.declaration.as_ref() {
        match declaration {
            Declaration::FunctionDeclaration(function) => {
                if let Some(component) = component_from_function_declaration(
                    function,
                    file_path,
                    display_source,
                    app_relative_path,
                    source,
                ) {
                    state.local_components.insert(component.name.clone(), component.clone());
                    state.exported_components.insert(component.name.clone(), component);
                }
            }
            Declaration::VariableDeclaration(declaration) => collect_variable_components(
                declaration.declarations.iter(),
                file_path,
                display_source,
                app_relative_path,
                source,
                state,
                true,
            ),
            Declaration::TSInterfaceDeclaration(interface_decl) => {
                state.types.insert(
                    interface_decl.id.name.to_string(),
                    TypeDef {
                        expr: type_expr_from_interface(interface_decl, source),
                    },
                );
            }
            Declaration::TSTypeAliasDeclaration(type_alias) => {
                state.types.insert(
                    type_alias.id.name.to_string(),
                    TypeDef {
                        expr: type_expr_from_type(&type_alias.type_annotation, source),
                    },
                );
            }
            _ => {}
        }
        return;
    }

    let type_only_declaration = export_decl.export_kind == ImportOrExportKind::Type;
    let source_module = export_decl
        .source
        .as_ref()
        .map(|value| unquote(slice_span(source, value.span)));

    for specifier in &export_decl.specifiers {
        let local = module_export_name_to_string(&specifier.local);
        let exported = module_export_name_to_string(&specifier.exported);
        let type_only = type_only_declaration || specifier.export_kind == ImportOrExportKind::Type;

        if let Some(source_module) = &source_module {
            let reexport = ReExport {
                source: source_module.clone(),
                imported: local,
            };
            if type_only {
                state.named_type_reexports.insert(exported, reexport);
            } else {
                state.named_component_reexports.insert(exported, reexport);
            }
            continue;
        }

        if type_only {
            continue;
        }

        if let Some(component) = state.local_components.get(&local).cloned() {
            let mut exported_component = component;
            exported_component.name = exported.clone();
            state.exported_components.insert(exported, exported_component);
        }
    }
}

fn collect_default_export(
    export_default: &oxc_allocator::Box<'_, oxc_ast::ast::ExportDefaultDeclaration<'_>>,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
    default_name: &str,
    state: &mut ModuleParseState,
) {
    match &export_default.declaration {
        ExportDefaultDeclarationKind::FunctionDeclaration(function) => {
            let component_name = function
                .id
                .as_ref()
                .map(|id| id.name.to_string())
                .unwrap_or_else(|| default_name.to_string());
            if let Some(component) = component_from_function_like(
                &component_name,
                function.params.items.first(),
                function.body.as_ref().map(|body| &body.statements),
                file_path,
                display_source,
                app_relative_path,
                source,
            ) {
                state.local_components.insert(component.name.clone(), component.clone());
                state.exported_components.insert(component.name.clone(), component.clone());
                state.default_component = Some(component.name);
            }
        }
        ExportDefaultDeclarationKind::Identifier(identifier) => {
            let name = identifier.name.to_string();
            if let Some(component) = state.local_components.get(&name).cloned() {
                state.exported_components.entry(name.clone()).or_insert(component);
                state.default_component = Some(name);
            }
        }
        ExportDefaultDeclarationKind::ArrowFunctionExpression(arrow) => {
            if let Some(component) = component_from_arrow(
                default_name,
                arrow,
                file_path,
                display_source,
                app_relative_path,
                source,
            ) {
                state.exported_components.insert(component.name.clone(), component.clone());
                state.default_component = Some(component.name);
            }
        }
        ExportDefaultDeclarationKind::FunctionExpression(function) => {
            let component_name = function
                .id
                .as_ref()
                .map(|id| id.name.to_string())
                .unwrap_or_else(|| default_name.to_string());
            if let Some(component) = component_from_function_like(
                &component_name,
                function.params.items.first(),
                function.body.as_ref().map(|body| &body.statements),
                file_path,
                display_source,
                app_relative_path,
                source,
            ) {
                state.local_components.insert(component.name.clone(), component.clone());
                state.exported_components.insert(component.name.clone(), component.clone());
                state.default_component = Some(component.name);
            }
        }
        _ => {}
    }
}

fn collect_variable_components<'a, I>(
    declarators: I,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
    state: &mut ModuleParseState,
    export_all: bool,
) where
    I: IntoIterator<Item = &'a oxc_ast::ast::VariableDeclarator<'a>>,
{
    for declarator in declarators {
        let BindingPattern::BindingIdentifier(identifier) = &declarator.id else {
            continue;
        };
        let Some(init) = declarator.init.as_ref() else {
            continue;
        };
        let name = identifier.name.to_string();
        if let Some(component) = component_from_expression(
            &name,
            init,
            file_path,
            display_source,
            app_relative_path,
            source,
        ) {
            state.local_components.insert(component.name.clone(), component.clone());
            if export_all {
                state.exported_components.insert(component.name.clone(), component);
            }
        }
    }
}

fn component_from_function_declaration(
    function: &oxc_allocator::Box<'_, oxc_ast::ast::Function<'_>>,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
) -> Option<ComponentDecl> {
    let name = function.id.as_ref()?.name.to_string();
    component_from_function_like(
        &name,
        function.params.items.first(),
        function.body.as_ref().map(|body| &body.statements),
        file_path,
        display_source,
        app_relative_path,
        source,
    )
}

fn component_from_expression(
    name: &str,
    expression: &Expression<'_>,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
) -> Option<ComponentDecl> {
    match expression {
        Expression::ArrowFunctionExpression(arrow) => {
            component_from_arrow(name, arrow, file_path, display_source, app_relative_path, source)
        }
        Expression::FunctionExpression(function) => component_from_function_like(
            name,
            function.params.items.first(),
            function.body.as_ref().map(|body| &body.statements),
            file_path,
            display_source,
            app_relative_path,
            source,
        ),
        Expression::ParenthesizedExpression(parenthesized) => component_from_expression(
            name,
            &parenthesized.expression,
            file_path,
            display_source,
            app_relative_path,
            source,
        ),
        Expression::TSAsExpression(asserted) => component_from_expression(
            name,
            &asserted.expression,
            file_path,
            display_source,
            app_relative_path,
            source,
        ),
        Expression::TSSatisfiesExpression(asserted) => component_from_expression(
            name,
            &asserted.expression,
            file_path,
            display_source,
            app_relative_path,
            source,
        ),
        Expression::TSTypeAssertion(asserted) => component_from_expression(
            name,
            &asserted.expression,
            file_path,
            display_source,
            app_relative_path,
            source,
        ),
        Expression::TSNonNullExpression(asserted) => component_from_expression(
            name,
            &asserted.expression,
            file_path,
            display_source,
            app_relative_path,
            source,
        ),
        Expression::TSInstantiationExpression(instantiated) => component_from_expression(
            name,
            &instantiated.expression,
            file_path,
            display_source,
            app_relative_path,
            source,
        ),
        Expression::CallExpression(call) => call.arguments.iter().find_map(|argument| match argument {
            Argument::SpreadElement(_) => None,
            _ => component_from_expression(
                name,
                argument.to_expression(),
                file_path,
                display_source,
                app_relative_path,
                source,
            ),
        }),
        _ => None,
    }
}

fn component_from_arrow(
    name: &str,
    arrow: &oxc_allocator::Box<'_, oxc_ast::ast::ArrowFunctionExpression<'_>>,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
) -> Option<ComponentDecl> {
    component_from_function_like(
        name,
        arrow.params.items.first(),
        Some(&arrow.body.statements),
        file_path,
        display_source,
        app_relative_path,
        source,
    )
}

fn component_from_function_like(
    name: &str,
    first_param: Option<&FormalParameter<'_>>,
    body_statements: Option<&oxc_allocator::Vec<'_, Statement<'_>>>,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
) -> Option<ComponentDecl> {
    if !is_component_name(name) {
        return None;
    }
    let Some(body_statements) = body_statements else {
        return None;
    };
    if !statements_contain_jsx(body_statements) {
        return None;
    }

    Some(ComponentDecl {
        name: name.to_string(),
        file_path: file_path.to_path_buf(),
        source_display: display_source.to_string(),
        app_relative_path: app_relative_path.cloned(),
        props: parse_props_annotation(first_param, source),
    })
}

fn parse_props_annotation(param: Option<&FormalParameter<'_>>, source: &str) -> PropsAnnotation {
    let Some(param) = param else {
        return PropsAnnotation::None;
    };
    let Some(annotation) = param.type_annotation.as_ref() else {
        return PropsAnnotation::None;
    };
    match &annotation.type_annotation {
        TSType::TSTypeReference(reference) => {
            PropsAnnotation::Named(reference_name(slice_span(source, reference.type_name.span())))
        }
        TSType::TSTypeLiteral(_) => PropsAnnotation::InlineObject,
        _ => PropsAnnotation::None,
    }
}

fn type_expr_from_interface(
    interface_decl: &oxc_allocator::Box<'_, oxc_ast::ast::TSInterfaceDeclaration<'_>>,
    source: &str,
) -> TypeExpr {
    let mut parts = interface_decl
        .extends
        .iter()
        .map(|heritage| TypeExpr::Reference(reference_name(slice_span(source, heritage.expression.span()))))
        .collect::<Vec<_>>();

    let props = interface_decl
        .body
        .body
        .iter()
        .filter_map(|signature| match signature {
            TSSignature::TSPropertySignature(property) => property_key_name(&property.key, source)
                .map(|name| PropDef {
                    name,
                    value_type: property
                        .type_annotation
                        .as_ref()
                        .map(|annotation| prop_value_type_from_type(&annotation.type_annotation, source))
                        .unwrap_or(PropValueType::Unknown),
                }),
            _ => None,
        })
        .collect::<Vec<_>>();

    if !props.is_empty() {
        parts.push(TypeExpr::Object(props));
    }

    match parts.len() {
        0 => TypeExpr::Unknown,
        1 => parts.remove(0),
        _ => TypeExpr::Intersection(parts),
    }
}

fn type_expr_from_type(type_annotation: &TSType<'_>, source: &str) -> TypeExpr {
    match type_annotation {
        TSType::TSTypeLiteral(type_literal) => TypeExpr::Object(
            type_literal
                .members
                .iter()
                .filter_map(|signature| match signature {
                    TSSignature::TSPropertySignature(property) => property_key_name(&property.key, source)
                        .map(|name| PropDef {
                            name,
                            value_type: property
                                .type_annotation
                                .as_ref()
                                .map(|annotation| {
                                    prop_value_type_from_type(&annotation.type_annotation, source)
                                })
                                .unwrap_or(PropValueType::Unknown),
                        }),
                    _ => None,
                })
                .collect(),
        ),
        TSType::TSIntersectionType(intersection) => TypeExpr::Intersection(
            intersection
                .types
                .iter()
                .map(|nested| type_expr_from_type(nested, source))
                .collect(),
        ),
        TSType::TSTypeReference(reference) => {
            TypeExpr::Reference(reference_name(slice_span(source, reference.type_name.span())))
        }
        TSType::TSUnionType(union) => union_literals(union.types.iter().collect(), source)
            .map(TypeExpr::UnionLiterals)
            .unwrap_or(TypeExpr::Unknown),
        TSType::TSLiteralType(literal) => single_literal_value(&literal.literal, source)
            .map(|value| TypeExpr::UnionLiterals(vec![value]))
            .unwrap_or(TypeExpr::Unknown),
        TSType::TSParenthesizedType(parenthesized) => {
            type_expr_from_type(&parenthesized.type_annotation, source)
        }
        _ => TypeExpr::Unknown,
    }
}

fn prop_value_type_from_type(type_annotation: &TSType<'_>, source: &str) -> PropValueType {
    match type_annotation {
        TSType::TSTypeReference(reference) => {
            PropValueType::Reference(reference_name(slice_span(source, reference.type_name.span())))
        }
        TSType::TSUnionType(union) => union_literals(union.types.iter().collect(), source)
            .map(PropValueType::UnionLiterals)
            .unwrap_or(PropValueType::Unknown),
        TSType::TSLiteralType(literal) => single_literal_value(&literal.literal, source)
            .map(|value| PropValueType::UnionLiterals(vec![value]))
            .unwrap_or(PropValueType::Unknown),
        TSType::TSParenthesizedType(parenthesized) => {
            prop_value_type_from_type(&parenthesized.type_annotation, source)
        }
        _ => PropValueType::Unknown,
    }
}

fn union_literals(types: Vec<&TSType<'_>>, source: &str) -> Option<Vec<String>> {
    let mut values = Vec::new();
    for nested in types {
        values.push(single_type_literal_value(nested, source)?);
    }
    Some(values)
}

fn single_type_literal_value(type_annotation: &TSType<'_>, source: &str) -> Option<String> {
    match type_annotation {
        TSType::TSLiteralType(literal) => single_literal_value(&literal.literal, source),
        TSType::TSParenthesizedType(parenthesized) => {
            single_type_literal_value(&parenthesized.type_annotation, source)
        }
        _ => None,
    }
}

fn single_literal_value(literal: &TSLiteral<'_>, source: &str) -> Option<String> {
    let raw = slice_span(source, literal.span()).trim();
    Some(strip_wrapped_quotes(raw).unwrap_or(raw).to_string())
}

fn statements_contain_jsx(statements: &oxc_allocator::Vec<'_, Statement<'_>>) -> bool {
    statements.iter().any(statement_contains_jsx)
}

fn statement_contains_jsx(statement: &Statement<'_>) -> bool {
    match statement {
        Statement::ExpressionStatement(expression) => expression_contains_jsx(&expression.expression),
        Statement::ReturnStatement(return_statement) => return_statement
            .argument
            .as_ref()
            .map(expression_contains_jsx)
            .unwrap_or(false),
        Statement::VariableDeclaration(declaration) => declaration.declarations.iter().any(|declarator| {
            declarator
                .init
                .as_ref()
                .map(expression_contains_jsx)
                .unwrap_or(false)
        }),
        Statement::BlockStatement(block) => block.body.iter().any(statement_contains_jsx),
        Statement::IfStatement(if_statement) => {
            expression_contains_jsx(&if_statement.test)
                || statement_contains_jsx(&if_statement.consequent)
                || if_statement
                    .alternate
                    .as_ref()
                    .map(statement_contains_jsx)
                    .unwrap_or(false)
        }
        Statement::SwitchStatement(switch_statement) => {
            expression_contains_jsx(&switch_statement.discriminant)
                || switch_statement.cases.iter().any(|case| {
                    case.test.as_ref().map(expression_contains_jsx).unwrap_or(false)
                        || case.consequent.iter().any(statement_contains_jsx)
                })
        }
        Statement::ForStatement(for_statement) => {
            for_statement
                .init
                .as_ref()
                .map(for_statement_init_contains_jsx)
                .unwrap_or(false)
                || for_statement
                    .test
                    .as_ref()
                    .map(expression_contains_jsx)
                    .unwrap_or(false)
                || for_statement
                    .update
                    .as_ref()
                    .map(expression_contains_jsx)
                    .unwrap_or(false)
                || statement_contains_jsx(&for_statement.body)
        }
        Statement::ForInStatement(for_statement) => {
            expression_contains_jsx(&for_statement.right) || statement_contains_jsx(&for_statement.body)
        }
        Statement::ForOfStatement(for_statement) => {
            expression_contains_jsx(&for_statement.right) || statement_contains_jsx(&for_statement.body)
        }
        Statement::WhileStatement(while_statement) => {
            expression_contains_jsx(&while_statement.test) || statement_contains_jsx(&while_statement.body)
        }
        Statement::DoWhileStatement(while_statement) => {
            statement_contains_jsx(&while_statement.body) || expression_contains_jsx(&while_statement.test)
        }
        Statement::TryStatement(try_statement) => {
            try_statement.block.body.iter().any(statement_contains_jsx)
                || try_statement
                    .handler
                    .as_ref()
                    .map(|handler| handler.body.body.iter().any(statement_contains_jsx))
                    .unwrap_or(false)
                || try_statement
                    .finalizer
                    .as_ref()
                    .map(|finalizer| finalizer.body.iter().any(statement_contains_jsx))
                    .unwrap_or(false)
        }
        Statement::FunctionDeclaration(function) => function
            .body
            .as_ref()
            .map(|body| statements_contain_jsx(&body.statements))
            .unwrap_or(false),
        _ => false,
    }
}

fn for_statement_init_contains_jsx(init: &oxc_ast::ast::ForStatementInit<'_>) -> bool {
    match init {
        oxc_ast::ast::ForStatementInit::VariableDeclaration(declaration) => {
            declaration.declarations.iter().any(|declarator| {
                declarator
                    .init
                    .as_ref()
                    .map(expression_contains_jsx)
                    .unwrap_or(false)
            })
        }
        _ => init
            .as_expression()
            .map(expression_contains_jsx)
            .unwrap_or(false),
    }
}

fn expression_contains_jsx(expression: &Expression<'_>) -> bool {
    match expression {
        Expression::JSXElement(_) | Expression::JSXFragment(_) => true,
        Expression::ParenthesizedExpression(parenthesized) => {
            expression_contains_jsx(&parenthesized.expression)
        }
        Expression::CallExpression(call) => {
            expression_contains_jsx(&call.callee) || call.arguments.iter().any(argument_contains_jsx)
        }
        Expression::ConditionalExpression(conditional) => {
            expression_contains_jsx(&conditional.test)
                || expression_contains_jsx(&conditional.consequent)
                || expression_contains_jsx(&conditional.alternate)
        }
        Expression::LogicalExpression(logical) => {
            expression_contains_jsx(&logical.left) || expression_contains_jsx(&logical.right)
        }
        Expression::BinaryExpression(binary) => {
            expression_contains_jsx(&binary.left) || expression_contains_jsx(&binary.right)
        }
        Expression::AssignmentExpression(assignment) => expression_contains_jsx(&assignment.right),
        Expression::ArrayExpression(array) => array.elements.iter().any(|element| match element {
            oxc_ast::ast::ArrayExpressionElement::SpreadElement(spread) => {
                expression_contains_jsx(&spread.argument)
            }
            oxc_ast::ast::ArrayExpressionElement::Elision(_) => false,
            _ => expression_contains_jsx(element.to_expression()),
        }),
        Expression::ObjectExpression(object) => object.properties.iter().any(|property| match property {
            oxc_ast::ast::ObjectPropertyKind::ObjectProperty(property) => {
                expression_contains_jsx(&property.value)
            }
            oxc_ast::ast::ObjectPropertyKind::SpreadProperty(spread) => {
                expression_contains_jsx(&spread.argument)
            }
        }),
        Expression::SequenceExpression(sequence) => {
            sequence.expressions.iter().any(expression_contains_jsx)
        }
        Expression::UnaryExpression(unary) => expression_contains_jsx(&unary.argument),
        Expression::AwaitExpression(await_expression) => expression_contains_jsx(&await_expression.argument),
        Expression::ArrowFunctionExpression(arrow) => statements_contain_jsx(&arrow.body.statements),
        Expression::FunctionExpression(function) => function
            .body
            .as_ref()
            .map(|body| statements_contain_jsx(&body.statements))
            .unwrap_or(false),
        Expression::TSAsExpression(asserted) => expression_contains_jsx(&asserted.expression),
        Expression::TSSatisfiesExpression(asserted) => expression_contains_jsx(&asserted.expression),
        Expression::TSTypeAssertion(asserted) => expression_contains_jsx(&asserted.expression),
        Expression::TSNonNullExpression(asserted) => expression_contains_jsx(&asserted.expression),
        Expression::TSInstantiationExpression(instantiated) => {
            expression_contains_jsx(&instantiated.expression)
        }
        Expression::ComputedMemberExpression(member) => {
            expression_contains_jsx(&member.object) || expression_contains_jsx(&member.expression)
        }
        Expression::StaticMemberExpression(member) => expression_contains_jsx(&member.object),
        Expression::PrivateFieldExpression(member) => expression_contains_jsx(&member.object),
        _ => false,
    }
}

fn argument_contains_jsx(argument: &Argument<'_>) -> bool {
    match argument {
        Argument::SpreadElement(spread) => expression_contains_jsx(&spread.argument),
        _ => expression_contains_jsx(argument.to_expression()),
    }
}

fn is_component_name(name: &str) -> bool {
    name.chars().next().map(|ch| ch.is_ascii_uppercase()).unwrap_or(false)
}

fn module_export_name_to_string(name: &ModuleExportName<'_>) -> String {
    match name {
        ModuleExportName::IdentifierName(identifier) => identifier.name.to_string(),
        ModuleExportName::IdentifierReference(identifier) => identifier.name.to_string(),
        ModuleExportName::StringLiteral(string) => unquote(string.value.as_str()),
    }
}

fn default_export_name(path: &Path) -> String {
    let stem = path
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("DefaultComponent");
    let mut chars = stem.chars();
    match chars.next() {
        Some(first) if first.is_ascii_uppercase() => stem.to_string(),
        Some(first) => format!("{}{}", first.to_ascii_uppercase(), chars.as_str()),
        None => "DefaultComponent".to_string(),
    }
}

fn reference_name(raw: &str) -> String {
    raw.split('<').next().unwrap_or(raw).trim().to_string()
}

fn slice_span<'a>(source: &'a str, span: oxc_span::Span) -> &'a str {
    &source[span.start as usize..span.end as usize]
}

fn unquote(value: &str) -> String {
    strip_wrapped_quotes(value).unwrap_or(value).to_string()
}

fn strip_wrapped_quotes(value: &str) -> Option<&str> {
    let trimmed = value.trim();
    if trimmed.len() >= 2
        && ((trimmed.starts_with('"') && trimmed.ends_with('"'))
            || (trimmed.starts_with('\'') && trimmed.ends_with('\''))
            || (trimmed.starts_with('`') && trimmed.ends_with('`')))
    {
        Some(&trimmed[1..trimmed.len() - 1])
    } else {
        None
    }
}

fn property_key_name(property_key: &PropertyKey<'_>, source: &str) -> Option<String> {
    match property_key {
        PropertyKey::StaticIdentifier(identifier) => Some(identifier.name.to_string()),
        PropertyKey::StringLiteral(_) => Some(unquote(slice_span(source, property_key.span()))),
        PropertyKey::NumericLiteral(_) => Some(slice_span(source, property_key.span()).to_string()),
        _ => None,
    }
}

pub fn local_source_display(root: &Path, file_path: &Path) -> String {
    if let Ok(relative) = file_path.strip_prefix(root.join("src")) {
        return format!("./{}", path_to_posix(relative));
    }
    if let Ok(relative) = file_path.strip_prefix(root) {
        return format!("./{}", path_to_posix(relative));
    }
    file_path.to_string_lossy().replace('\\', "/")
}

pub fn path_to_posix(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}