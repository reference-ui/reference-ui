use oxc_allocator::Allocator;
use oxc_ast::ast::{
    CallExpression, Expression, ImportDeclaration, ImportDeclarationSpecifier, ImportOrExportKind,
    Statement,
};
use oxc_ast_visit::{walk, Visit};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};

#[derive(Clone)]
struct TextReplacement {
    start: usize,
    end: usize,
    replacement: String,
}

struct FunctionCallCollector<'a> {
    from_name: &'a str,
    replacements: Vec<TextReplacement>,
    to_name: &'a str,
}

struct ImportBindingPlan {
    call_target_name: String,
    last_import_end: usize,
}

pub fn replace_function_name(
    source_code: &str,
    relative_path: &str,
    from_name: &str,
    to_name: &str,
    import_from: Option<&str>,
) -> String {
    if from_name == to_name {
        return source_code.to_string();
    }

    let allocator = Allocator::default();
    let source_type = SourceType::from_path(relative_path).unwrap_or_default();
    let parse_result = Parser::new(&allocator, source_code, source_type).parse();

    let import_binding_plan = match import_from {
        Some(import_from) => {
            let Some(plan) = resolve_import_binding(
                source_code,
                &parse_result.program.body,
                import_from,
                from_name,
            ) else {
                return source_code.to_string();
            };

            Some(plan)
        }
        None => None,
    };
    let call_target_name = import_binding_plan
        .as_ref()
        .map_or_else(|| from_name.to_string(), |plan| plan.call_target_name.clone());

    let mut collector = FunctionCallCollector {
        from_name: &call_target_name,
        replacements: Vec::new(),
        to_name,
    };

    collector.visit_program(&parse_result.program);

    if let Some(plan) = import_binding_plan {
        if collector.replacements.is_empty() {
            return source_code.to_string();
        }

        collector.replacements.push(TextReplacement {
            start: plan.last_import_end,
            end: plan.last_import_end,
            replacement: format!("\nconst {} = {};", to_name, plan.call_target_name),
        });
    }

    apply_local_replacements(source_code, &collector.replacements)
}

fn resolve_import_binding(
    source_code: &str,
    body: &[Statement<'_>],
    import_from: &str,
    from_name: &str,
 ) -> Option<ImportBindingPlan> {
    let mut matched_local_name = None;
    let mut last_import_end = None;

    for statement in body.iter() {
        let Statement::ImportDeclaration(import) = statement else {
            continue;
        };

        last_import_end = Some(import.span.end as usize);

        if matches_import_source(source_code, import, import_from) {
            matched_local_name = find_import_local_name(source_code, import, from_name)
                .or(matched_local_name);
        }
    }

    let Some(call_target_name) = matched_local_name else {
        return None;
    };

    let Some(last_import_end) = last_import_end else {
        return None;
    };

    Some(ImportBindingPlan {
        call_target_name,
        last_import_end,
    })
}

fn find_import_local_name(
    source_code: &str,
    import: &ImportDeclaration<'_>,
    from_name: &str,
 ) -> Option<String> {
    let specifiers = import.specifiers.as_ref()?;

    for specifier in specifiers {
        let ImportDeclarationSpecifier::ImportSpecifier(named) = specifier else {
            continue;
        };

        if named.imported.name().as_str() != from_name {
            continue;
        }

        return Some(
            source_code[named.local.span.start as usize..named.local.span.end as usize].to_string(),
        );
    }

    None
}

fn matches_import_source(source_code: &str, import: &ImportDeclaration<'_>, import_from: &str) -> bool {
    import.import_kind != ImportOrExportKind::Type
        && import_module_specifier(source_code, import) == import_from
}

fn import_module_specifier<'a>(source_code: &'a str, import: &ImportDeclaration<'_>) -> &'a str {
    let source_str =
        &source_code[import.source.span.start as usize..import.source.span.end as usize];

    source_str.trim_matches('"').trim_matches('\'').trim()
}

impl<'a> Visit<'a> for FunctionCallCollector<'a> {
    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        let Expression::Identifier(identifier) = call.callee.get_inner_expression() else {
            walk::walk_call_expression(self, call);
            return;
        };

        if identifier.name.as_str() == self.from_name {
            let span = identifier.span();
            self.replacements.push(TextReplacement {
                start: span.start as usize,
                end: span.end as usize,
                replacement: self.to_name.to_string(),
            });
        }

        walk::walk_call_expression(self, call);
    }
}

fn apply_local_replacements(source_code: &str, replacements: &[TextReplacement]) -> String {
    if replacements.is_empty() {
        return source_code.to_string();
    }

    let mut rewritten = source_code.to_string();
    let mut ordered = replacements.to_vec();
    ordered.sort_by(|left, right| right.start.cmp(&left.start));

    for replacement in ordered {
        rewritten.replace_range(replacement.start..replacement.end, &replacement.replacement);
    }

    rewritten
}