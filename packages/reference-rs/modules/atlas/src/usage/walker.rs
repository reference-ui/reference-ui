//! Finds every JSX element in one module and records it as a `JsxOccurrence` for the usage passes.
//! It parses the module with oxc and walks the whole program with oxc's `Visit` trait, so JSX is found
//! wherever the grammar allows it: class bodies, `new` arguments, `throw`, optional calls, template
//! literals, default parameters and any other expression position. Occurrences come out in source
//! pre-order (a parent before its attributes and children), which the usage and observe passes rely on.

use super::literals::{jsx_attribute_from_item, jsx_child_is_meaningful, jsx_name_to_string, slice_span};
use crate::internal::{JsxOccurrence, ModuleInfo};
use oxc_allocator::Allocator;
use oxc_ast::ast::JSXElement;
use oxc_ast_visit::{walk, Visit};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};

pub(super) fn find_jsx_occurrences(module: &ModuleInfo) -> Vec<JsxOccurrence> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(&module.path).unwrap_or_else(|_| SourceType::tsx());
    let parsed = Parser::new(&allocator, &module.content, source_type).parse();
    let mut collector = OccurrenceCollector {
        source: &module.content,
        occurrences: Vec::new(),
    };
    collector.visit_program(&parsed.program);
    collector.occurrences
}

/// One module's JSX walk: the source text for snippets, and the occurrences found so far.
struct OccurrenceCollector<'s> {
    source: &'s str,
    occurrences: Vec<JsxOccurrence>,
}

impl<'a> Visit<'a> for OccurrenceCollector<'_> {
    fn visit_jsx_element(&mut self, element: &JSXElement<'a>) {
        let opening = &element.opening_element;
        self.occurrences.push(JsxOccurrence {
            tag_name: jsx_name_to_string(&opening.name),
            snippet: slice_span(self.source, opening.span()).trim().to_string(),
            attributes: opening
                .attributes
                .iter()
                .filter_map(|attribute| jsx_attribute_from_item(attribute, self.source))
                .collect(),
            has_children: element.children.iter().any(jsx_child_is_meaningful),
        });
        walk::walk_jsx_element(self, element);
    }
}
