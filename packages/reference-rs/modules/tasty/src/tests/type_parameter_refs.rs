//! Unit tests for the `type_parameter` flag on references bound by a type parameter or `infer` name.
//! Each fixture is written to a temporary workspace and scanned, so library files come from `node_modules`
//! as they do in a real scan. The tests pin the flag on bound and unbound references, substitution and
//! distribution of a library generic alias (both keyed on the flag rather than the source module), and the
//! guards that keep a type parameter from attaching to a same-named symbol or pulling a same-named local
//! declaration into a library's export closure.

use crate::ast::{extract_ast, resolve_ast};
use crate::model::{TsSymbol, TypeRef};
use crate::scanner::{scan_workspace, symbol_id};

use super::fixtures::TempDir;

fn resolved_symbols(files: &[(&str, &str)]) -> Vec<TsSymbol> {
    let root = TempDir::new("tasty-type-parameter-refs");
    for (path, source) in files {
        root.write(path, source);
    }
    let scanned = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("workspace scan should succeed");
    let parsed = extract_ast(&scanned).expect("extract should succeed");
    assert!(parsed.diagnostics.is_empty(), "{:?}", parsed.diagnostics);
    let graph = resolve_ast(parsed).expect("resolve should succeed");
    graph.symbols.into_values().collect()
}

fn named<'a>(symbols: &'a [TsSymbol], name: &str) -> &'a TsSymbol {
    symbols
        .iter()
        .find(|symbol| symbol.name == name)
        .unwrap_or_else(|| panic!("symbol {name} should resolve"))
}

fn member_type<'a>(symbol: &'a TsSymbol, member: &str) -> &'a TypeRef {
    symbol
        .defined_members
        .iter()
        .find(|candidate| candidate.name == member)
        .and_then(|candidate| candidate.type_ref.as_ref())
        .unwrap_or_else(|| panic!("member {member} should carry a type"))
}

#[test]
fn bound_reference_carries_the_flag_and_an_unbound_one_does_not() {
    let symbols = resolved_symbols(&[(
        "src/index.ts",
        "export interface Item { id: string }\n\
         export interface Wrap<Item> { value: Item }\n\
         export interface UsesItem { item: Item }\n",
    )]);

    let TypeRef::Reference {
        name,
        target_id,
        type_parameter,
        ..
    } = member_type(named(&symbols, "Wrap"), "value")
    else {
        panic!("Wrap.value should be a reference");
    };
    assert_eq!(name, "Item");
    assert_eq!(
        target_id, &None,
        "a bound name keeps no target after resolution"
    );
    assert!(
        *type_parameter,
        "a bound name carries the type-parameter flag"
    );

    let TypeRef::Reference {
        target_id,
        type_parameter,
        ..
    } = member_type(named(&symbols, "UsesItem"), "item")
    else {
        panic!("UsesItem.item should be a reference");
    };
    assert_eq!(target_id.as_ref(), Some(&symbol_id("src/index.ts", "Item")));
    assert!(
        !*type_parameter,
        "an unbound name resolves to its symbol and is unflagged"
    );
}

#[test]
fn infer_name_in_the_true_branch_carries_the_flag() {
    let symbols = resolved_symbols(&[(
        "src/index.ts",
        "export interface U { tag: string }\n\
         export type Flatten<T> = T extends Array<infer U> ? U : T\n",
    )]);

    let Some(TypeRef::Conditional {
        true_type,
        false_type,
        ..
    }) = named(&symbols, "Flatten").underlying.as_ref()
    else {
        panic!("Flatten should lower to a conditional");
    };
    assert!(
        matches!(
            true_type.as_ref(),
            TypeRef::Reference { name, target_id: None, type_parameter: true, .. } if name == "U"
        ),
        "the infer name in the true branch is flagged: {true_type:?}"
    );
    assert!(
        matches!(
            false_type.as_ref(),
            TypeRef::Reference { name, target_id: None, type_parameter: true, .. } if name == "T"
        ),
        "the alias parameter in the false branch is flagged: {false_type:?}"
    );
}

#[test]
fn library_generic_alias_substitutes_its_parameter_by_flag() {
    let symbols = resolved_symbols(&[
        ("src/index.ts", "export type { Boxed } from 'lib-pkg'\n"),
        (
            "node_modules/lib-pkg/package.json",
            r#"{ "name": "lib-pkg", "types": "index.d.ts" }"#,
        ),
        (
            "node_modules/lib-pkg/index.d.ts",
            "export type Box<T> = { value: T }\nexport type Boxed = Box<string>\n",
        ),
    ]);

    let Some(TypeRef::Object { members }) = named(&symbols, "Boxed").underlying.as_ref() else {
        panic!("Boxed should expand to an object type");
    };
    let value = members
        .iter()
        .find(|member| member.name == "value")
        .expect("Boxed carries the value member");
    assert_eq!(
        value.type_ref,
        Some(TypeRef::Intrinsic {
            name: "string".to_string()
        }),
        "a library alias's parameter is substituted even though its references carry a module"
    );
}

#[test]
fn library_generic_conditional_distributes_over_a_union_argument() {
    let symbols = resolved_symbols(&[
        ("src/index.ts", "export type { Dist } from 'lib-pkg'\n"),
        (
            "node_modules/lib-pkg/package.json",
            r#"{ "name": "lib-pkg", "types": "index.d.ts" }"#,
        ),
        (
            "node_modules/lib-pkg/index.d.ts",
            "export type Pick2<T> = T extends string ? 'str' : 'other'\nexport type Dist = Pick2<string | number>\n",
        ),
    ]);

    let Some(TypeRef::Conditional { resolved, .. }) = named(&symbols, "Dist").underlying.as_ref()
    else {
        panic!("Dist should expand to a conditional");
    };
    assert!(
        resolved.is_some(),
        "the naked check parameter distributes over the union in a library file"
    );
}

#[test]
fn unsupplied_parameter_stays_bound_and_never_attaches_a_same_named_symbol() {
    let symbols = resolved_symbols(&[(
        "src/index.ts",
        "export interface B { y: number }\n\
         export type Two<A, B> = [A, B]\n\
         export type Bad = Two<string>\n",
    )]);

    let Some(TypeRef::Tuple { elements }) = named(&symbols, "Bad").underlying.as_ref() else {
        panic!("Bad should expand to a tuple");
    };
    let TypeRef::Reference {
        name,
        target_id,
        type_parameter,
        ..
    } = &elements[1].element
    else {
        panic!("the unsupplied element should stay a reference");
    };
    assert_eq!(name, "B");
    assert_eq!(
        target_id, &None,
        "the top-level B must not capture the parameter"
    );
    assert!(*type_parameter);
}

#[test]
fn library_local_named_like_a_type_parameter_is_not_pulled_into_the_library() {
    let symbols = resolved_symbols(&[
        (
            "src/index.ts",
            "export type { Wrap, Holder } from 'lib-pkg'\n",
        ),
        (
            "node_modules/lib-pkg/package.json",
            r#"{ "name": "lib-pkg", "types": "index.d.ts" }"#,
        ),
        (
            "node_modules/lib-pkg/index.d.ts",
            "interface Item { id: string }\n\
             export interface Wrap<Item> { value: Item }\n\
             export interface Holder { run<Item>(input: Item): Item }\n",
        ),
    ]);

    assert!(
        symbols.iter().all(|symbol| symbol.name != "Item"),
        "a type parameter's references must not materialize the same-named local declaration"
    );
    assert!(symbols.iter().any(|symbol| symbol.name == "Wrap"));
    assert!(symbols.iter().any(|symbol| symbol.name == "Holder"));
}
