pub(super) fn namespace_export_lookup_name(reference_name: &str) -> Option<&str> {
    let after_dot = reference_name.split_once('.')?.1;
    after_dot.split(['.', '<']).next()
}

pub(super) fn reference_lookup_name(reference_name: &str) -> &str {
    reference_name
        .split(['.', '<'])
        .next()
        .unwrap_or(reference_name)
}
