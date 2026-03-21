use std::collections::BTreeMap;

use oxc_ast::ast::{Comment, TSSignature};
use oxc_span::GetSpan;

use super::signatures::{
    call_signature_to_member, construct_signature_to_member, index_signature_to_member,
    method_signature_to_member, property_signature_to_member,
};
use crate::tasty::ast::model::ImportBinding;
use crate::tasty::model::TsMember;

pub(crate) fn members_from_signatures(
    signatures: &[TSSignature<'_>],
    source: &str,
    comments: &[Comment],
    container_start: Option<u32>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> Vec<TsMember> {
    let env = MemberEnv {
        source,
        comments,
        import_bindings,
        module_specifier: current_module_specifier,
        library: current_library,
    };
    let starts = signature_start_positions(signatures);

    signatures
        .iter()
        .map(|signature| {
            let exclude = member_exclusion_starts(signature, &starts, container_start);
            env.convert_signature(signature, exclude.as_deref())
        })
        .collect()
}

struct MemberEnv<'a> {
    source: &'a str,
    comments: &'a [Comment],
    import_bindings: &'a BTreeMap<String, ImportBinding>,
    module_specifier: &'a str,
    library: &'a str,
}

impl MemberEnv<'_> {
    fn convert_signature(&self, signature: &TSSignature<'_>, exclude: Option<&[u32]>) -> TsMember {
        use TSSignature as Sig;

        match signature {
            Sig::TSPropertySignature(property) => property_signature_to_member(
                property,
                self.source,
                self.comments,
                exclude,
                self.import_bindings,
                self.module_specifier,
                self.library,
            ),
            Sig::TSMethodSignature(method) => method_signature_to_member(
                method,
                self.source,
                self.comments,
                exclude,
                self.import_bindings,
                self.module_specifier,
                self.library,
            ),
            Sig::TSCallSignatureDeclaration(call) => call_signature_to_member(
                call,
                self.source,
                self.comments,
                exclude,
                self.import_bindings,
                self.module_specifier,
                self.library,
            ),
            Sig::TSIndexSignature(index) => index_signature_to_member(
                index,
                self.source,
                self.comments,
                exclude,
                self.import_bindings,
                self.module_specifier,
                self.library,
            ),
            Sig::TSConstructSignatureDeclaration(decl) => construct_signature_to_member(
                decl,
                self.source,
                self.comments,
                exclude,
                self.import_bindings,
                self.module_specifier,
                self.library,
            ),
        }
    }
}

fn signature_start_positions(signatures: &[TSSignature<'_>]) -> Vec<u32> {
    signatures.iter().map(|s| s.span().start).collect()
}

fn member_exclusion_starts(
    current_signature: &TSSignature<'_>,
    all_member_starts: &[u32],
    container_start: Option<u32>,
) -> Option<Vec<u32>> {
    let current_start = current_signature.span().start;
    let mut exclude: Vec<u32> = all_member_starts
        .iter()
        .copied()
        .filter(|&start| start != current_start)
        .collect();

    if let Some(container_start) = container_start {
        exclude.insert(0, container_start);
    }

    (!exclude.is_empty()).then_some(exclude)
}
