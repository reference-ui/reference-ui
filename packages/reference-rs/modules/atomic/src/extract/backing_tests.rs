//! Unit pins for what backs a styled non-host tag.
//!
//! A published package backs under its systems this compile composes, in composed order, and
//! never under a composed system it does not render through; with none composed it is unbacked
//! and names its own system; an unreadable published file is unbacked and names the file; a
//! foreign package lowers nothing. A tag no import binds backs under the upstreams that publish
//! its name, and any other project or unbound tag under own, never under a composed system.

use std::collections::BTreeMap;
use std::fs;

use shared::testing::ScratchWorkspace;

use super::{Composed, TagBacking, UnbackedReason};
use crate::atom::Backing;
use crate::extract::package_system::{published, PackageTag, PackageVerdict};
use crate::extract::provenance::TagProvenance;

/// A package tag whose published system file holds `body`.
fn published_tag(scratch: &ScratchWorkspace, body: &str) -> PackageTag {
    scratch.write("acme/baseSystem.mjs", body);
    let path = fs::canonicalize(scratch.root().join("acme/baseSystem.mjs")).expect("written");
    PackageTag {
        specifier: "@acme/ui".into(),
        dir: Some("acme".into()),
        verdict: PackageVerdict::Published(published(&path.to_string_lossy())),
    }
}

fn qualifiers(names: &[&str]) -> Vec<String> {
    names.iter().map(ToString::to_string).collect()
}

fn backed(verdict: TagBacking<'_>) -> Option<Backing> {
    match verdict {
        TagBacking::Backed(backing) => Some(backing),
        _ => None,
    }
}

const LIB_SHAPE: &str = "export const baseSystem = { \"name\": \"reference-ui\", \"streams\": \
    [{ \"name\": \"reference-icons\" }, { \"name\": \"reference-ui\" }] };\n";

#[test]
fn a_published_package_backs_under_its_composed_systems_only() {
    let scratch = ScratchWorkspace::new("backing-published");
    let tag = published_tag(&scratch, LIB_SHAPE);
    let hosts = BTreeMap::new();
    let all = qualifiers(&["app", "acme", "reference-ui", "reference-icons"]);
    let composed = Composed::new(&all, &hosts);
    assert_eq!(
        backed(composed.package(&tag)),
        Some(Backing::systems(["reference-ui", "reference-icons"])),
        "composed order, and never `acme`"
    );
    let icons_only = qualifiers(&["app", "reference-icons"]);
    let composed = Composed::new(&icons_only, &hosts);
    assert_eq!(
        backed(composed.package(&tag)),
        Some(Backing::systems(["reference-icons"]))
    );
}

#[test]
fn a_published_package_nothing_composed_backs_is_unbacked_and_named() {
    let scratch = ScratchWorkspace::new("backing-unbacked");
    let tag = published_tag(
        &scratch,
        "export const baseSystem = { \"name\": \"acme\" }\n",
    );
    let hosts = BTreeMap::new();
    let partial = qualifiers(&["app", "reference-ui"]);
    let composed = Composed::new(&partial, &hosts);
    let verdict = composed.package(&tag);
    assert_eq!(verdict.lowering(), Some(Backing::none()));
    let TagBacking::Unbacked(unbacked) = verdict else {
        panic!("acme is not composed: {verdict:?}");
    };
    assert_eq!(&*unbacked.package.specifier, "@acme/ui");
    let UnbackedReason::NotComposed(names) = unbacked.reason else {
        panic!("the file reads");
    };
    assert_eq!(names.name, "acme");
}

#[test]
fn an_unreadable_published_system_is_unbacked_naming_the_file() {
    let scratch = ScratchWorkspace::new("backing-unreadable");
    let tag = published_tag(&scratch, "export default {}\n");
    let hosts = BTreeMap::new();
    let all = qualifiers(&["app", "acme"]);
    let verdict = Composed::new(&all, &hosts).package(&tag);
    let TagBacking::Unbacked(unbacked) = verdict else {
        panic!("an unreadable system backs nothing: {verdict:?}");
    };
    let UnbackedReason::Unreadable(why) = unbacked.reason else {
        panic!("the file does not parse");
    };
    assert!(why.contains("acme/baseSystem.mjs"), "{why}");
}

#[test]
fn a_foreign_package_lowers_nothing() {
    let hosts = BTreeMap::new();
    let all = qualifiers(&["app", "acme"]);
    let composed = Composed::new(&all, &hosts);
    let tag = PackageTag::unresolved("lucide-react");
    assert!(matches!(composed.package(&tag), TagBacking::Foreign));
    assert_eq!(composed.package(&tag).lowering(), None);
}

#[test]
fn an_unbound_published_name_backs_under_its_publisher_and_the_rest_own() {
    let mut hosts = BTreeMap::new();
    hosts.insert(
        "acme".to_string(),
        vec!["AcmeCard".to_string(), "OverlayContent".to_string()],
    );
    hosts.insert("other".to_string(), vec!["Other".to_string()]);
    let all = qualifiers(&["app", "reference-ui", "acme"]);
    let composed = Composed::new(&all, &hosts);
    let unbound = TagProvenance::Unbound;
    assert_eq!(
        backed(composed.non_host(None, &unbound, "AcmeCard")),
        Some(Backing::systems(["acme"]))
    );
    assert_eq!(
        backed(composed.non_host(None, &unbound, "Overlay.Content")),
        Some(Backing::systems(["acme"])),
        "member tags match their concatenated spelling"
    );
    assert_eq!(
        backed(composed.non_host(None, &unbound, "Other")),
        Some(Backing::Own),
        "`other` is not composed, so nothing composed renders it"
    );
    assert_eq!(
        backed(composed.non_host(None, &TagProvenance::Local, "AcmeCard")),
        Some(Backing::Own),
        "a project binding outranks the published spelling"
    );
    assert_eq!(
        backed(composed.non_host(None, &TagProvenance::Own, "Mystery")),
        Some(Backing::Own)
    );
    let standalone = Composed::standalone();
    assert_eq!(
        backed(standalone.non_host(None, &unbound, "AcmeCard")),
        Some(Backing::Own),
        "standalone, an unbound tag lowers under own too"
    );
}
