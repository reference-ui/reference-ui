//! Same-file `css` wrappers for the JSX mirror. Extraction lowers a wrapper's
//! call-site `css` as if written on the host it forwards into (own, never
//! external), and ignores every other attribute on it. The mirror reads the
//! same wrapper set, collected by extraction's own pre-pass over the same host
//! gate, and predicts that one block the same way, so a composed foreign
//! qualifier never turns an own wrapper's `css` into a phantom foreign lookup.

use oxc_ast::ast::{JSXAttributeItem, JSXOpeningElement};

use super::super::jsx_attrs::format_attribute_name;
use super::super::{AnalysisCtx, AnalyzedSource};
use super::JsxVisitor;
use crate::extract::wrapper_thread::{self, WrapperThreads};
use crate::extract::{HostGate, JsxHosts};

/// The wrappers extraction threads in this source: its pre-pass over its own
/// gate inputs (the file's Reference imports, the traced and configured
/// hosts, and the shared provenance).
pub(super) fn collect_threads(
    ctx: &AnalysisCtx<'_>,
    source: &AnalyzedSource<'_>,
) -> WrapperThreads {
    // A wrapper spells `css` twice (key and attribute); most files skip the walk.
    if !source.content.contains("css") {
        return WrapperThreads::default();
    }
    let gate = HostGate {
        hosts: JsxHosts {
            local: source.bindings.jsx_hosts_ref(),
            global: &ctx.hosts,
        },
        bindings: source.bindings,
    };
    wrapper_thread::collect(source.program, gate)
}

impl JsxVisitor<'_, '_> {
    /// Lower a threaded wrapper the way extraction does, after the host
    /// gate and before the external one. True when the tag threads (handled,
    /// even with no `css` attribute).
    pub(super) fn lowers_threaded(&mut self, tag: &str, elem: &JSXOpeningElement<'_>) -> bool {
        if self.allows_tag(tag) || !self.threads_css(tag) {
            return false;
        }
        for item in &elem.attributes {
            // Spread bags and every sibling are the wrapper's own props.
            let JSXAttributeItem::Attribute(attr) = item else {
                continue;
            };
            if attr.value.is_some() && format_attribute_name(&attr.name) == "css" {
                self.walk_attr_value(false, "css", attr);
            }
        }
        true
    }

    /// True when the tag threads `css` into a host and no inner scope
    /// rebinds it, as extraction's `threads_css` decides.
    fn threads_css(&self, tag: &str) -> bool {
        !self.shadows.iter().skip(1).any(|scope| scope.contains(tag))
            && self.threads.threads_css(tag)
    }
}
