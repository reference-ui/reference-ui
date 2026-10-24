//! Finds every JSX element in a parsed program and records each as a `JsxOccurrence`.
//! It takes the program the module parse already holds and walks all of it with oxc's `Visit` trait, so JSX is found
//! wherever the grammar allows it: class bodies, `new` arguments, `throw`, optional calls, template
//! literals, default parameters and any other expression position. Occurrences come out in source
//! pre-order (a parent before its attributes and children), which the usage and observe passes rely on. The parser stores the
//! result on the module, so a module is parsed once for its declarations, occurrences and scope names.

use super::literals::{jsx_attribute_from_item, jsx_child_is_meaningful, jsx_name_to_string, slice_span};
use crate::internal::JsxOccurrence;
use oxc_ast::ast::{JSXElement, Program};
use oxc_ast_visit::{walk, Visit};
use oxc_span::GetSpan;

/// Every JSX element of `program` in source pre-order, with snippets sliced from `source`.
pub(crate) fn find_jsx_occurrences(program: &Program<'_>, source: &str) -> Vec<JsxOccurrence> {
    let mut collector = OccurrenceCollector {
        source,
        occurrences: Vec::new(),
    };
    collector.visit_program(program);
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
