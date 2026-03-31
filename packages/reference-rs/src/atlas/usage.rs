use crate::atlas::internal::{JsxAttribute, JsxOccurrence, ModuleInfo, UsageState};
use crate::atlas::model::Component;
use crate::atlas::resolver::{build_alias_map, resolve_occurrence_key};
use crate::atlas::usage_policy::score_usage;
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Argument, Expression, JSXAttributeItem, JSXAttributeName, JSXAttributeValue, JSXChild,
    JSXElementName, JSXExpression, JSXMemberExpressionObject, Statement,
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::PathBuf;

pub fn collect_usage_for_module(
    module: &ModuleInfo,
    modules: &HashMap<PathBuf, ModuleInfo>,
    state_snapshot: &BTreeMap<String, UsageState>,
    states: &mut BTreeMap<String, UsageState>,
) {
    let alias_map = build_alias_map(module, modules, state_snapshot);
    let namespace_map = module.namespace_imports.clone();
    let mut seen_in_file = BTreeSet::new();

    for occurrence in find_jsx_occurrences(module) {
        let resolved_key = resolve_occurrence_key(module, modules, &occurrence.tag_name, &alias_map, &namespace_map, state_snapshot);
        let Some(key) = resolved_key else {
            continue;
        };
        let Some(state) = states.get_mut(&key) else {
            continue;
        };

        state.component.count += 1;
        if state.example_set.insert(occurrence.snippet.clone()) && state.component.examples.len() < 5 {
            state.component.examples.push(occurrence.snippet.clone());
        }
        seen_in_file.insert(key.clone());

        let mut explicit_names = BTreeSet::new();
        for attribute in occurrence.attributes {
            explicit_names.insert(attribute.name.clone());
            if let Some(prop) = state.component.props.iter_mut().find(|prop| prop.name == attribute.name) {
                prop.count += 1;
            }
            if let Some(value) = attribute.literal_value {
                state
                    .prop_value_counts
                    .entry(attribute.name)
                    .or_default()
                    .entry(value)
                    .and_modify(|count| *count += 1)
                    .or_insert(1);
            }
        }

        if occurrence.has_children && !explicit_names.contains("children") {
            if let Some(prop) = state.component.props.iter_mut().find(|prop| prop.name == "children") {
                prop.count += 1;
            }
        }
    }

    for key in &seen_in_file {
        if let Some(state) = states.get_mut(key) {
            state.file_presence_count += 1;
        }
    }

    let seen_keys = seen_in_file.into_iter().collect::<Vec<_>>();
    for left_key in &seen_keys {
        let other_names = seen_keys
            .iter()
            .filter(|right_key| *right_key != left_key)
            .filter_map(|right_key| state_snapshot.get(right_key).map(|state| state.component.name.clone()))
            .collect::<Vec<_>>();
        if let Some(state) = states.get_mut(left_key) {
            for other_name in other_names {
                state
                    .used_with_counts
                    .entry(other_name)
                    .and_modify(|count| *count += 1)
                    .or_insert(1);
            }
        }
    }
}

pub fn finalize_components(states: BTreeMap<String, UsageState>) -> Vec<Component> {
    let total_count = states.values().map(|state| state.component.count).sum::<u32>();
    let mut components = Vec::new();

    for (_, mut state) in states {
        state.component.usage = score_usage(state.component.count, total_count);

        for prop in &mut state.component.props {
            prop.usage = score_usage(prop.count, state.component.count);

            let mut values = BTreeMap::new();
            if let Some(allowed) = state.prop_allowed_values.get(&prop.name) {
                for value in allowed {
                    let count = state
                        .prop_value_counts
                        .get(&prop.name)
                        .and_then(|counts| counts.get(value))
                        .copied()
                        .unwrap_or(0);
                    values.insert(value.clone(), score_usage(count, prop.count));
                }
            }

            if let Some(observed) = state.prop_value_counts.get(&prop.name) {
                for (value, count) in observed {
                    values.insert(value.clone(), score_usage(*count, prop.count));
                }
            }

            prop.values = (!values.is_empty()).then_some(values);
        }

        state.component.props.sort_by(|left, right| left.name.cmp(&right.name));
        state.component.used_with = state
            .used_with_counts
            .into_iter()
            .map(|(name, count)| (name, score_usage(count, state.file_presence_count)))
            .collect();
        components.push(state.component);
    }

    components.sort_by(|left, right| left.name.cmp(&right.name).then(left.source.cmp(&right.source)));
    components
}

fn find_jsx_occurrences(module: &ModuleInfo) -> Vec<JsxOccurrence> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(&module.path).unwrap_or_else(|_| SourceType::tsx());
    let parsed = Parser::new(&allocator, &module.content, source_type).parse();
    let mut occurrences = Vec::new();

    for statement in parsed.program.body.iter() {
        collect_occurrences_from_statement(statement, &module.content, &mut occurrences);
    }

    occurrences
}

fn collect_occurrences_from_statement(
    statement: &Statement<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    match statement {
        Statement::ExpressionStatement(expression) => {
            collect_occurrences_from_expression(&expression.expression, source, occurrences)
        }
        Statement::ReturnStatement(return_statement) => {
            if let Some(argument) = &return_statement.argument {
                collect_occurrences_from_expression(argument, source, occurrences);
            }
        }
        Statement::VariableDeclaration(declaration) => {
            for declarator in &declaration.declarations {
                if let Some(init) = &declarator.init {
                    collect_occurrences_from_expression(init, source, occurrences);
                }
            }
        }
        Statement::BlockStatement(block) => {
            for nested in &block.body {
                collect_occurrences_from_statement(nested, source, occurrences);
            }
        }
        Statement::IfStatement(if_statement) => {
            collect_occurrences_from_expression(&if_statement.test, source, occurrences);
            collect_occurrences_from_statement(&if_statement.consequent, source, occurrences);
            if let Some(alternate) = &if_statement.alternate {
                collect_occurrences_from_statement(alternate, source, occurrences);
            }
        }
        Statement::SwitchStatement(switch_statement) => {
            collect_occurrences_from_expression(&switch_statement.discriminant, source, occurrences);
            for case in &switch_statement.cases {
                if let Some(test) = &case.test {
                    collect_occurrences_from_expression(test, source, occurrences);
                }
                for nested in &case.consequent {
                    collect_occurrences_from_statement(nested, source, occurrences);
                }
            }
        }
        Statement::ForStatement(for_statement) => {
            if let Some(init) = &for_statement.init {
                match init {
                    oxc_ast::ast::ForStatementInit::VariableDeclaration(declaration) => {
                        for declarator in &declaration.declarations {
                            if let Some(init) = &declarator.init {
                                collect_occurrences_from_expression(init, source, occurrences);
                            }
                        }
                    }
                    _ => {
                        if let Some(expression) = init.as_expression() {
                        collect_occurrences_from_expression(expression, source, occurrences)
                        }
                    }
                }
            }
            if let Some(test) = &for_statement.test {
                collect_occurrences_from_expression(test, source, occurrences);
            }
            if let Some(update) = &for_statement.update {
                collect_occurrences_from_expression(update, source, occurrences);
            }
            collect_occurrences_from_statement(&for_statement.body, source, occurrences);
        }
        Statement::ForInStatement(for_statement) => {
            collect_occurrences_from_expression(&for_statement.right, source, occurrences);
            collect_occurrences_from_statement(&for_statement.body, source, occurrences);
        }
        Statement::ForOfStatement(for_statement) => {
            collect_occurrences_from_expression(&for_statement.right, source, occurrences);
            collect_occurrences_from_statement(&for_statement.body, source, occurrences);
        }
        Statement::WhileStatement(while_statement) => {
            collect_occurrences_from_expression(&while_statement.test, source, occurrences);
            collect_occurrences_from_statement(&while_statement.body, source, occurrences);
        }
        Statement::DoWhileStatement(while_statement) => {
            collect_occurrences_from_statement(&while_statement.body, source, occurrences);
            collect_occurrences_from_expression(&while_statement.test, source, occurrences);
        }
        Statement::TryStatement(try_statement) => {
            for nested in &try_statement.block.body {
                collect_occurrences_from_statement(nested, source, occurrences);
            }
            if let Some(handler) = &try_statement.handler {
                for nested in &handler.body.body {
                    collect_occurrences_from_statement(nested, source, occurrences);
                }
            }
            if let Some(finalizer) = &try_statement.finalizer {
                for nested in &finalizer.body {
                    collect_occurrences_from_statement(nested, source, occurrences);
                }
            }
        }
        Statement::FunctionDeclaration(function) => {
            if let Some(body) = &function.body {
                for nested in &body.statements {
                    collect_occurrences_from_statement(nested, source, occurrences);
                }
            }
        }
        Statement::ExportNamedDeclaration(export_decl) => {
            if let Some(declaration) = &export_decl.declaration {
                match declaration {
                    oxc_ast::ast::Declaration::FunctionDeclaration(function) => {
                        if let Some(body) = &function.body {
                            for nested in &body.statements {
                                collect_occurrences_from_statement(nested, source, occurrences);
                            }
                        }
                    }
                    oxc_ast::ast::Declaration::VariableDeclaration(declaration) => {
                        for declarator in &declaration.declarations {
                            if let Some(init) = &declarator.init {
                                collect_occurrences_from_expression(init, source, occurrences);
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        Statement::ExportDefaultDeclaration(export_default) => match &export_default.declaration {
            oxc_ast::ast::ExportDefaultDeclarationKind::FunctionDeclaration(function) => {
                if let Some(body) = &function.body {
                    for nested in &body.statements {
                        collect_occurrences_from_statement(nested, source, occurrences);
                    }
                }
            }
            oxc_ast::ast::ExportDefaultDeclarationKind::ArrowFunctionExpression(arrow) => {
                for nested in &arrow.body.statements {
                    collect_occurrences_from_statement(nested, source, occurrences);
                }
            }
            oxc_ast::ast::ExportDefaultDeclarationKind::FunctionExpression(function) => {
                if let Some(body) = &function.body {
                    for nested in &body.statements {
                        collect_occurrences_from_statement(nested, source, occurrences);
                    }
                }
            }
            expression => {
                if let Some(expression) = export_default_expression(expression) {
                    collect_occurrences_from_expression(expression, source, occurrences);
                }
            }
        },
        _ => {}
    }
}

fn collect_occurrences_from_expression(
    expression: &Expression<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    match expression {
        Expression::JSXElement(element) => collect_occurrences_from_jsx_element(element, source, occurrences),
        Expression::JSXFragment(fragment) => {
            collect_occurrences_from_jsx_fragment(fragment, source, occurrences)
        }
        Expression::ParenthesizedExpression(parenthesized) => {
            collect_occurrences_from_expression(&parenthesized.expression, source, occurrences)
        }
        Expression::CallExpression(call) => {
            collect_occurrences_from_expression(&call.callee, source, occurrences);
            for argument in &call.arguments {
                collect_occurrences_from_argument(argument, source, occurrences);
            }
        }
        Expression::ConditionalExpression(conditional) => {
            collect_occurrences_from_expression(&conditional.test, source, occurrences);
            collect_occurrences_from_expression(&conditional.consequent, source, occurrences);
            collect_occurrences_from_expression(&conditional.alternate, source, occurrences);
        }
        Expression::LogicalExpression(logical) => {
            collect_occurrences_from_expression(&logical.left, source, occurrences);
            collect_occurrences_from_expression(&logical.right, source, occurrences);
        }
        Expression::BinaryExpression(binary) => {
            collect_occurrences_from_expression(&binary.left, source, occurrences);
            collect_occurrences_from_expression(&binary.right, source, occurrences);
        }
        Expression::AssignmentExpression(assignment) => {
            collect_occurrences_from_expression(&assignment.right, source, occurrences)
        }
        Expression::ArrayExpression(array) => {
            for element in &array.elements {
                match element {
                    oxc_ast::ast::ArrayExpressionElement::SpreadElement(spread) => {
                        collect_occurrences_from_expression(&spread.argument, source, occurrences)
                    }
                    oxc_ast::ast::ArrayExpressionElement::Elision(_) => {}
                    _ => collect_occurrences_from_expression(element.to_expression(), source, occurrences),
                }
            }
        }
        Expression::ObjectExpression(object) => {
            for property in &object.properties {
                match property {
                    oxc_ast::ast::ObjectPropertyKind::ObjectProperty(property) => {
                        collect_occurrences_from_expression(&property.value, source, occurrences)
                    }
                    oxc_ast::ast::ObjectPropertyKind::SpreadProperty(spread) => {
                        collect_occurrences_from_expression(&spread.argument, source, occurrences)
                    }
                }
            }
        }
        Expression::SequenceExpression(sequence) => {
            for expression in &sequence.expressions {
                collect_occurrences_from_expression(expression, source, occurrences);
            }
        }
        Expression::UnaryExpression(unary) => {
            collect_occurrences_from_expression(&unary.argument, source, occurrences)
        }
        Expression::AwaitExpression(await_expression) => {
            collect_occurrences_from_expression(&await_expression.argument, source, occurrences)
        }
        Expression::ArrowFunctionExpression(arrow) => {
            for nested in &arrow.body.statements {
                collect_occurrences_from_statement(nested, source, occurrences);
            }
        }
        Expression::FunctionExpression(function) => {
            if let Some(body) = &function.body {
                for nested in &body.statements {
                    collect_occurrences_from_statement(nested, source, occurrences);
                }
            }
        }
        Expression::TSAsExpression(asserted) => {
            collect_occurrences_from_expression(&asserted.expression, source, occurrences)
        }
        Expression::TSSatisfiesExpression(asserted) => {
            collect_occurrences_from_expression(&asserted.expression, source, occurrences)
        }
        Expression::TSTypeAssertion(asserted) => {
            collect_occurrences_from_expression(&asserted.expression, source, occurrences)
        }
        Expression::TSNonNullExpression(asserted) => {
            collect_occurrences_from_expression(&asserted.expression, source, occurrences)
        }
        Expression::TSInstantiationExpression(instantiated) => {
            collect_occurrences_from_expression(&instantiated.expression, source, occurrences)
        }
        Expression::ComputedMemberExpression(member) => {
            collect_occurrences_from_expression(&member.object, source, occurrences);
            collect_occurrences_from_expression(&member.expression, source, occurrences);
        }
        Expression::StaticMemberExpression(member) => {
            collect_occurrences_from_expression(&member.object, source, occurrences)
        }
        Expression::PrivateFieldExpression(member) => {
            collect_occurrences_from_expression(&member.object, source, occurrences)
        }
        _ => {}
    }
}

fn collect_occurrences_from_argument(
    argument: &Argument<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    match argument {
        Argument::SpreadElement(spread) => {
            collect_occurrences_from_expression(&spread.argument, source, occurrences)
        }
        _ => collect_occurrences_from_expression(argument.to_expression(), source, occurrences),
    }
}

fn collect_occurrences_from_jsx_attribute_item(
    attribute: &JSXAttributeItem<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    match attribute {
        JSXAttributeItem::Attribute(attribute) => {
            if let Some(value) = &attribute.value {
                match value {
                    JSXAttributeValue::ExpressionContainer(container) => {
                        collect_occurrences_from_jsx_expression(&container.expression, source, occurrences)
                    }
                    JSXAttributeValue::Element(element) => collect_occurrences_from_jsx_element(
                        element,
                        source,
                        occurrences,
                    ),
                    JSXAttributeValue::Fragment(fragment) => collect_occurrences_from_jsx_fragment(
                        fragment,
                        source,
                        occurrences,
                    ),
                    JSXAttributeValue::StringLiteral(_) => {}
                }
            }
        }
        JSXAttributeItem::SpreadAttribute(spread) => {
            collect_occurrences_from_expression(&spread.argument, source, occurrences)
        }
    }
}

fn collect_occurrences_from_jsx_child(
    child: &JSXChild<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    match child {
        JSXChild::Text(_) => {}
        JSXChild::Element(element) => collect_occurrences_from_jsx_element(element, source, occurrences),
        JSXChild::Fragment(fragment) => {
            collect_occurrences_from_jsx_fragment(fragment, source, occurrences)
        }
        JSXChild::ExpressionContainer(container) => {
            collect_occurrences_from_jsx_expression(&container.expression, source, occurrences)
        }
        JSXChild::Spread(spread) => {
            collect_occurrences_from_expression(&spread.expression, source, occurrences)
        }
    }
}

fn collect_occurrences_from_jsx_expression(
    expression: &JSXExpression<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    match expression {
        JSXExpression::EmptyExpression(_) => {}
        _ => collect_occurrences_from_expression(expression.to_expression(), source, occurrences),
    }
}

fn collect_occurrences_from_jsx_element(
    element: &oxc_ast::ast::JSXElement<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    occurrences.push(JsxOccurrence {
        tag_name: jsx_name_to_string(&element.opening_element.name),
        snippet: slice_span(source, element.span()).to_string(),
        attributes: element
            .opening_element
            .attributes
            .iter()
            .filter_map(|attribute| jsx_attribute_from_item(attribute, source))
            .collect(),
        has_children: element.children.iter().any(jsx_child_is_meaningful),
    });

    for attribute in &element.opening_element.attributes {
        collect_occurrences_from_jsx_attribute_item(attribute, source, occurrences);
    }
    for child in &element.children {
        collect_occurrences_from_jsx_child(child, source, occurrences);
    }
}

fn collect_occurrences_from_jsx_fragment(
    fragment: &oxc_ast::ast::JSXFragment<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    for child in &fragment.children {
        collect_occurrences_from_jsx_child(child, source, occurrences);
    }
}

fn jsx_attribute_from_item(attribute: &JSXAttributeItem<'_>, source: &str) -> Option<JsxAttribute> {
    let JSXAttributeItem::Attribute(attribute) = attribute else {
        return None;
    };

    Some(JsxAttribute {
        name: jsx_attribute_name_to_string(&attribute.name),
        literal_value: jsx_attribute_literal_value(attribute.value.as_ref(), source),
    })
}

fn jsx_attribute_literal_value(
    value: Option<&JSXAttributeValue<'_>>,
    source: &str,
) -> Option<String> {
    match value {
        None => Some("true".to_string()),
        Some(JSXAttributeValue::StringLiteral(literal)) => Some(literal.value.to_string()),
        Some(JSXAttributeValue::ExpressionContainer(container)) => {
            jsx_expression_literal_value(&container.expression, source)
        }
        Some(JSXAttributeValue::Element(_)) | Some(JSXAttributeValue::Fragment(_)) => None,
    }
}

fn jsx_expression_literal_value(expression: &JSXExpression<'_>, source: &str) -> Option<String> {
    match expression {
        JSXExpression::EmptyExpression(_) => None,
        _ => expression_literal_value(expression.to_expression(), source),
    }
}

fn expression_literal_value(expression: &Expression<'_>, source: &str) -> Option<String> {
    match expression {
        Expression::StringLiteral(literal) => Some(literal.value.to_string()),
        Expression::BooleanLiteral(literal) => Some(literal.value.to_string()),
        Expression::NumericLiteral(_) => Some(slice_span(source, expression.span()).trim().to_string()),
        Expression::TemplateLiteral(template) if template.expressions.is_empty() => {
            Some(slice_span(source, template.span()).trim_matches('`').to_string())
        }
        Expression::ParenthesizedExpression(parenthesized) => {
            expression_literal_value(&parenthesized.expression, source)
        }
        Expression::TSAsExpression(asserted) => expression_literal_value(&asserted.expression, source),
        Expression::TSSatisfiesExpression(asserted) => {
            expression_literal_value(&asserted.expression, source)
        }
        Expression::TSTypeAssertion(asserted) => {
            expression_literal_value(&asserted.expression, source)
        }
        Expression::TSNonNullExpression(asserted) => {
            expression_literal_value(&asserted.expression, source)
        }
        _ => None,
    }
}

fn jsx_name_to_string(name: &JSXElementName<'_>) -> String {
    match name {
        JSXElementName::Identifier(identifier) => identifier.name.to_string(),
        JSXElementName::IdentifierReference(identifier) => identifier.name.to_string(),
        JSXElementName::NamespacedName(namespaced) => {
            format!("{}:{}", namespaced.namespace.name, namespaced.name.name)
        }
        JSXElementName::MemberExpression(member) => {
            format!("{}.{}", jsx_member_object_to_string(&member.object), member.property.name)
        }
        JSXElementName::ThisExpression(_) => "this".to_string(),
    }
}

fn jsx_member_object_to_string(object: &JSXMemberExpressionObject<'_>) -> String {
    match object {
        JSXMemberExpressionObject::IdentifierReference(identifier) => identifier.name.to_string(),
        JSXMemberExpressionObject::MemberExpression(member) => {
            format!("{}.{}", jsx_member_object_to_string(&member.object), member.property.name)
        }
        JSXMemberExpressionObject::ThisExpression(_) => "this".to_string(),
    }
}

fn jsx_attribute_name_to_string(name: &JSXAttributeName<'_>) -> String {
    match name {
        JSXAttributeName::Identifier(identifier) => identifier.name.to_string(),
        JSXAttributeName::NamespacedName(namespaced) => {
            format!("{}:{}", namespaced.namespace.name, namespaced.name.name)
        }
    }
}

fn jsx_child_is_meaningful(child: &JSXChild<'_>) -> bool {
    match child {
        JSXChild::Text(text) => !text.value.trim().is_empty(),
        _ => true,
    }
}

fn export_default_expression<'a>(
    expression: &'a oxc_ast::ast::ExportDefaultDeclarationKind<'a>,
) -> Option<&'a Expression<'a>> {
    match expression {
        oxc_ast::ast::ExportDefaultDeclarationKind::FunctionDeclaration(_) => None,
        oxc_ast::ast::ExportDefaultDeclarationKind::ClassDeclaration(_) => None,
        oxc_ast::ast::ExportDefaultDeclarationKind::TSInterfaceDeclaration(_) => None,
        _ => Some(expression.to_expression()),
    }
}

fn slice_span<'a>(source: &'a str, span: oxc_span::Span) -> &'a str {
    &source[span.start as usize..span.end as usize]
}
