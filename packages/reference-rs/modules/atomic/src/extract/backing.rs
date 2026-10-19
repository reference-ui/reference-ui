//! Which systems back a styled tag that no own host admits.
//!
//! The renderer owns the class: a tag whose root ends at a package that published a system
//! renders through that package's runtime, so its style props back under the systems the package
//! renders through that this compile composes (`extends` and `layers`), and nowhere else. When none
//! is composed nothing can back them, and the tag warns, naming the package. A package not built on
//! Reference UI (`Foreign`) is not a Reference component at all: nothing lowers and nothing warns. A
//! tag with no binding that a composed upstream publishes backs under that upstream. Any other
//! project or unbound tag nobody traces or publishes lowers under own, and under no composed
//! system: own is what it renders through if it forwards a style prop at all, and dead weight if not.
//! [`Composed`] carries the composed facts; extraction and the analysis mirror both ask it, so
//! the wants and the expected lookups name the same systems.

use std::collections::BTreeMap;

use crate::atom::Backing;

use super::package_system::{PackageTag, PackageVerdict, SystemNames};
use super::provenance::TagProvenance;

/// No upstream publishes anything: the standalone compile.
static NO_HOSTS: BTreeMap<String, Vec<String>> = BTreeMap::new();

/// What this compile composes: each upstream system (deduped, own removed,
/// request order) and the component names each publishes.
#[derive(Debug, Clone)]
pub struct Composed<'a> {
    systems: &'a [String],
    hosts: &'a BTreeMap<String, Vec<String>>,
}

/// How one styled non-host tag lowers.
#[derive(Debug)]
pub(crate) enum TagBacking<'t> {
    /// Lower under this backing.
    Backed(Backing),
    /// Lower under nothing and warn: the package renders through systems
    /// this compile cannot back.
    Unbacked(Unbacked<'t>),
    /// Not a Reference component: lower nothing, say nothing.
    Foreign,
}

/// A package tag nothing composed backs, and why.
#[derive(Debug, Clone, Copy)]
pub(crate) struct Unbacked<'t> {
    pub(crate) package: &'t PackageTag,
    pub(crate) reason: UnbackedReason<'t>,
}

impl<'t> TagBacking<'t> {
    /// What the tag lowers under: nothing at all for a foreign tag, no
    /// system for an unbacked one.
    pub(crate) fn lowering(&self) -> Option<Backing> {
        match self {
            Self::Backed(backing) => Some(backing.clone()),
            Self::Unbacked(_) => Some(Backing::none()),
            Self::Foreign => None,
        }
    }

    /// The warning an unbacked tag owes, if it is one.
    pub(crate) fn unbacked(&self) -> Option<Unbacked<'t>> {
        match self {
            Self::Unbacked(unbacked) => Some(*unbacked),
            _ => None,
        }
    }
}

/// Why a published package's tag cannot be backed.
#[derive(Debug, Clone, Copy)]
pub(crate) enum UnbackedReason<'t> {
    /// None of the systems it renders through is composed.
    NotComposed(&'t SystemNames),
    /// Its published system could not be read; the text names the file.
    Unreadable(&'t str),
}

impl<'a> Composed<'a> {
    /// The composed facts from the own-first qualifier list and the
    /// request's published host names.
    pub fn new(qualifiers: &'a [String], hosts: &'a BTreeMap<String, Vec<String>>) -> Self {
        let systems = qualifiers.get(1..).unwrap_or_default();
        Self { systems, hosts }
    }

    /// Nothing composed: the standalone compile.
    pub fn standalone() -> Composed<'static> {
        Composed::new(&[], &NO_HOSTS)
    }

    /// The backing of a styled tag no own host admits: its package's when
    /// its root (or the wrapper it is) ends at one, the publishing upstream's
    /// for an unbound name one publishes, else own.
    pub(crate) fn non_host<'t>(
        &self,
        package: Option<&'t PackageTag>,
        provenance: &TagProvenance,
        tag: &str,
    ) -> TagBacking<'t> {
        match package {
            Some(package) => self.package(package),
            None if matches!(provenance, TagProvenance::Unbound) => {
                TagBacking::Backed(self.unbound(tag))
            }
            None => TagBacking::Backed(Backing::Own),
        }
    }

    /// The backing of a tag whose root ends at `package`: its published
    /// systems this compile composes, in composed order.
    pub(crate) fn package<'t>(&self, package: &'t PackageTag) -> TagBacking<'t> {
        let PackageVerdict::Published(system) = &package.verdict else {
            return TagBacking::Foreign;
        };
        let reason = match system.names() {
            Ok(names) => {
                let backing = self.composed_of(&names.systems);
                if !backing.named().is_empty() {
                    return TagBacking::Backed(backing);
                }
                UnbackedReason::NotComposed(names)
            }
            Err(reason) => UnbackedReason::Unreadable(reason),
        };
        TagBacking::Unbacked(Unbacked { package, reason })
    }

    /// The backing of a tag no import binds: the composed upstreams that
    /// publish its name, else own.
    pub(crate) fn unbound(&self, tag: &str) -> Backing {
        let joined = tag.contains('.').then(|| tag.replace('.', ""));
        let publishes = |names: &Vec<String>| {
            names
                .iter()
                .any(|name| name == tag || joined.as_deref() == Some(name.as_str()))
        };
        let publishers: Vec<&str> = self
            .systems
            .iter()
            .filter(|system| self.hosts.get(system.as_str()).is_some_and(publishes))
            .map(String::as_str)
            .collect();
        if publishers.is_empty() {
            return Backing::Own;
        }
        Backing::systems(publishers)
    }

    /// The composed systems among `systems`, in composed order.
    fn composed_of(&self, systems: &[String]) -> Backing {
        Backing::systems(
            self.systems
                .iter()
                .filter(|system| systems.contains(system))
                .map(String::as_str),
        )
    }
}

#[cfg(test)]
#[path = "backing_tests.rs"]
mod tests;
