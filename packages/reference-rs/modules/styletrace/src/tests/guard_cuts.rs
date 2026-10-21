//! Pins which guard-limit cuts lose names. A cut whose reachable names are all traced loses nothing, so
//! the surface stays whole and the component stays silent; a cut that hides a name refuses the surface
//! and is reported once. Each test writes its own scratch tree and reads the names or the cut it produces.

use crate::{collect_reference_style_prop_names, collect_style_prop_names, StyleSurface};

use super::fixtures::ScratchDir;

/// `links` aliases, each adding one key nothing else declares, so a depth cap cuts the chain short.
fn link_chain(links: usize) -> String {
    let mut source = String::from("export type Link0 = { key0?: string }\n");
    for index in 1..=links {
        source.push_str(&format!(
            "export type Link{index} = Link{} & {{ key{index}?: string }}\n",
            index - 1
        ));
    }
    source
}

#[test]
fn a_surface_whose_chain_is_cut_by_the_depth_cap_is_refused() {
    let scratch = ScratchDir::new("surface-depth-cut");
    let mut source = link_chain(70);
    source.push_str("export type StyleProps = Link70\n");
    scratch.write("react/types/style-props.d.ts", &source);

    let error = StyleSurface::from_declaration_root(scratch.root())
        .expect_err("a surface whose chain hides keys behind the depth cap is incomplete");

    assert!(
        error.message().starts_with("STT-E-UNRESOLVED-SURFACE"),
        "expected the surface refusal code, got: {}",
        error.message()
    );
    assert!(
        error.message().contains("`Link6`") && error.message().contains("depth limit"),
        "expected the refusal to name Link6 and the depth limit, got: {}",
        error.message()
    );
}

#[test]
fn a_surface_whose_cut_loses_no_names_is_still_the_surface() {
    let scratch = ScratchDir::new("surface-lossless-cut");
    scratch.write(
        "react/types/style-props.d.ts",
        concat!(
            "type Box<T> = { value: T }\n",
            "type Nest<T> = T extends string ? Nest<T> : T & Nest<Box<T>>\n",
            "export type StyleProps = Nest<{ color?: string }>\n",
        ),
    );

    let names = collect_reference_style_prop_names(scratch.root())
        .expect("a cut that hides only names the surface already traces is not a refusal");

    assert!(names.contains(&"color".to_string()));
}

#[test]
fn a_lossy_cut_after_a_lossless_one_is_the_only_cut_reported() {
    let scratch = ScratchDir::new("lossless-then-lossy");
    let mut source = String::from(concat!(
        "type Box<T> = { value: T }\n",
        "type Nest<T> = T extends string ? Nest<T> : T & Nest<Box<T>>\n",
    ));
    source.push_str(&link_chain(70));
    source.push_str("export type Props = Nest<{ color?: string }> & Link70\n");
    scratch.write("src/props.ts", &source);

    let traced = collect_style_prop_names(
        scratch.root(),
        &scratch.root().join("src/props.ts"),
        "Props",
        None,
    )
    .expect("expected props to trace");

    let lossy: Vec<&str> = traced.cuts.iter().map(|cut| cut.name.as_str()).collect();
    assert_eq!(
        lossy,
        vec!["Link6"],
        "the Nest cut loses nothing; only the Link6 cut hides keys"
    );
}

#[test]
fn a_cut_that_hides_only_a_name_in_its_argument_is_lossy() {
    let scratch = ScratchDir::new("argument-only-cut");
    let mut source = String::from(concat!("type C0<T> = T\n", "type C1<T> = C0<T>\n",));
    for index in 2..=65 {
        source.push_str(&format!(
            "type C{index}<T> = C{}<T> & {{ k{index}?: string }}\n",
            index - 1
        ));
    }
    source.push_str("export type Props = C65<{ argOnly?: string }>\n");
    scratch.write("src/props.ts", &source);

    let traced = collect_style_prop_names(
        scratch.root(),
        &scratch.root().join("src/props.ts"),
        "Props",
        None,
    )
    .expect("expected props to trace");

    assert!(!traced.names.contains(&"argOnly".to_string()));
    let lossy: Vec<&str> = traced.cuts.iter().map(|cut| cut.name.as_str()).collect();
    assert_eq!(
        lossy,
        vec!["C1"],
        "C1 is refused before C0 reads its argument, so the argument's name is lost"
    );
}
