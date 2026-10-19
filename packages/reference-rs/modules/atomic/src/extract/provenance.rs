//! Tag provenance: where a JSX tag's root binding comes from, and the host
//! gate that reads it.
//!
//! Ownership is decided by provenance, not by name. A root imported from
//! `@reference-ui/react` / `styled` (directly or through project re-exports)
//! is `Own`; one that ends at a package directory is `Package`, carrying the
//! directory's verdict (a published system, or foreign), and is never an own
//! host, because that package renders through its own bundled runtime. Project
//! imports, same-file declarations and packages borrowing this compile's
//! runtime are `Local`, and names with no binding are `Unbound`: both keep
//! the roster match. [`HostGate`] is the verdict the JSX walk and the
//! `css`-threading pre-pass share.

use rustc_hash::FxHashSet;

use super::bindings::{is_shadowed, ExtractBindings, IdentityCtx};
use super::identity::Origin;
use super::jsx_hosts::JsxHosts;
use super::package_system::PackageTag;

/// Where one JSX tag root's binding comes from.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TagProvenance {
    /// A Reference package export: the import proves an own host.
    Own,
    /// A project import or declaration: own only through the host roster.
    Local,
    /// A package (its specifier, directory and verdict): never an own host.
    Package(PackageTag),
    /// No binding at all (a global): the host roster decides.
    Unbound,
}

static LOCAL: TagProvenance = TagProvenance::Local;
pub(super) static UNBOUND: TagProvenance = TagProvenance::Unbound;

impl From<Origin> for TagProvenance {
    fn from(origin: Origin) -> Self {
        match origin {
            Origin::Reference => Self::Own,
            Origin::Local => Self::Local,
            Origin::Package(tag) => Self::Package(tag),
        }
    }
}

/// How one import specifier binds: a named export (`default` included) or
/// the whole module.
#[derive(Clone, Copy)]
pub(super) enum ImportShape<'a> {
    Named(&'a str),
    Namespace,
}

/// The provenance of one non-Reference value import. With a project graph
/// the identity walk follows relative and `tsconfig`-aliased re-exports to
/// their end; without one, only the specifier's own spelling answers.
pub(super) fn import_provenance(
    ctx: Option<&IdentityCtx<'_, '_>>,
    source: &str,
    shape: ImportShape<'_>,
) -> TagProvenance {
    let origin = match (ctx, shape) {
        (Some(ctx), ImportShape::Named(imported)) => {
            ctx.graph.trace_origin(ctx.file, source, imported)
        }
        (Some(ctx), ImportShape::Namespace) => ctx.graph.namespace_origin(ctx.file, source),
        (None, _) => Origin::of_specifier(source),
    };
    origin.into()
}

/// The provenance of a tag root at a use site. A scope binding of the root
/// is a same-file declaration, which outranks any import.
pub fn classify<'b>(
    bindings: &'b ExtractBindings,
    shadowed: &[FxHashSet<String>],
    root: &str,
) -> &'b TagProvenance {
    if is_shadowed(shadowed, root) {
        return &LOCAL;
    }
    bindings.provenance(root)
}

/// The root binding of a tag: `Overlay` for `<Overlay.Content>`.
pub fn tag_root(tag: &str) -> &str {
    tag.split('.').next().unwrap_or(tag)
}

/// True when a bare specifier can name an installed package: `name[/sub]`
/// or `@scope/name[/sub]`, each segment lowercase-led as npm requires.
/// Alias spellings (`@/ui`, `~/ui`, `#ui`) and protocols (`node:fs`,
/// `virtual:x`) cannot, so they never read as packages.
pub(crate) fn names_package(specifier: &str) -> bool {
    let mut segments = specifier.split('/');
    let first = segments.next().unwrap_or_default();
    match first.strip_prefix('@') {
        Some(scope) => is_package_segment(scope) && segments.next().is_some_and(is_package_segment),
        None => is_package_segment(first),
    }
}

/// One npm name segment: a lowercase letter or digit, then URL-safe name characters.
fn is_package_segment(segment: &str) -> bool {
    let mut chars = segment.chars();
    chars
        .next()
        .is_some_and(|head| head.is_ascii_lowercase() || head.is_ascii_digit())
        && chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || "-._~".contains(c))
}

/// The scope-free host gate: the borrowed host roster plus this file's
/// provenance. A tag is an own host when its root is not package-bound and
/// its name (or member concatenation, `OverlayContent` for
/// `<Overlay.Content>`) is on the roster. Callers that track scopes veto
/// shadowed roots before asking.
#[derive(Clone, Copy)]
pub struct HostGate<'a> {
    pub hosts: JsxHosts<'a>,
    pub bindings: &'a ExtractBindings,
}

impl HostGate<'_> {
    /// True when the tag is an own host by provenance and roster.
    pub fn admits(&self, tag: &str) -> bool {
        !self.bindings.binds_package(tag_root(tag)) && self.names_host(tag)
    }

    /// True when the tag, or its concatenated member spelling, is on the roster.
    pub fn names_host(&self, tag: &str) -> bool {
        self.hosts.contains(tag)
            || (tag.contains('.') && self.hosts.contains(&tag.replace('.', "")))
    }
}

#[cfg(test)]
mod tests {
    use super::names_package;

    #[test]
    fn package_names_are_npm_shaped_and_aliases_are_not() {
        for specifier in [
            "react",
            "acme-ui",
            "react-dom/client",
            "@reference-ui/lib",
            "@reference-ui/lib/primitives",
            "@fixture/prebuilt",
            "lodash.merge",
            "3d-view",
        ] {
            assert!(names_package(specifier), "{specifier} names a package");
        }
        for specifier in [
            "@/ui",
            "~/ui",
            "#ui",
            "@/",
            "node:fs",
            "virtual:x",
            "",
            "Acme",
        ] {
            assert!(!names_package(specifier), "{specifier} is not a package");
        }
    }
}
