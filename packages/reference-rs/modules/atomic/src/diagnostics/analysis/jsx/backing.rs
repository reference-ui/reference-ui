//! The non-host verdict of the JSX mirror: what a capitalized tag no host admits lowers under,
//! decided by extraction's own [`Composed::non_host`] over the same package and provenance, so
//! the expected keys name exactly the systems extraction backs the wants under. The package is
//! the tag root's import after same-file const ident aliases, else the package a same-file
//! wrapper forwards its `css` into; a dropped tag, or one from a package not built on Reference
//! UI, predicts nothing.

use rustc_hash::FxHashSet;

use super::super::is_shadowed;
use super::JsxVisitor;
use crate::atom::Backing;
use crate::extract::provenance::{classify, tag_root};
use crate::extract::{PackageTag, TagProvenance};

impl<'b> JsxVisitor<'_, 'b> {
    /// Resolve the tag to its block verdict: own when the tag is a StyleProps
    /// host, the systems that render it for a capitalized non-host, `None`
    /// when it is dropped or comes from a package not built on Reference UI.
    /// Host membership decides first; then a capital tag lowers only once the
    /// host graph resolved (a file-local import or a traced/configured host),
    /// mirroring the extract gate's missing-graph guard so no phantom
    /// expectations arise.
    pub(super) fn tag_site(&self, tag: &str) -> Option<Backing> {
        if self.allows_tag(tag) {
            return Some(Backing::Own);
        }
        let graph_resolved = !self.host_gate().hosts.is_empty();
        if !graph_resolved || !crate::extract::jsx::is_external_tag(tag) {
            return None;
        }
        let package = self
            .bound_package(tag)
            .or_else(|| self.threads.package_forward(tag));
        let provenance = classify(self.provenance, &self.shadows, tag_root(tag));
        self.composed.non_host(package, provenance, tag).lowering()
    }

    /// The package a tag's root ends at, after same-file const ident aliases
    /// (`const Primary = Button`), the way extraction's `bound_package` reads it.
    fn bound_package(&self, tag: &str) -> Option<&'b PackageTag> {
        let root = self.alias_end(tag_root(tag));
        match classify(self.provenance, &self.shadows, root) {
            TagProvenance::Package(package) => Some(package),
            _ => None,
        }
    }

    /// Follow const ident aliases from `name` to their end, with a cycle guard.
    fn alias_end<'s>(&'s self, name: &'s str) -> &'s str {
        let mut current = name;
        let mut seen = FxHashSet::default();
        while seen.insert(current) {
            let Some(target) = self.const_alias(current) else {
                break;
            };
            current = target;
        }
        current
    }

    /// The target of `name` when its innermost binding is a const ident alias.
    fn const_alias(&self, name: &str) -> Option<&str> {
        let target = self.aliases.get(name)?;
        let aliased = is_shadowed(&self.shadows, name) && self.alias_binding_is_const(name);
        aliased.then_some(target.as_str())
    }
}
