//! Source discovery for the atomic compile pipeline.
//! Takes the request's virtual `files` list or `root_dir` and emits sorted
//! `(path, content)` pairs for extraction. The disk scan skips fixed build and
//! metadata directories plus non-source extensions; the include scope then
//! filters both paths to matching files, silently dropping the rest. An include pattern whose braces break the
//! shared limits fails the gather with an `IncludeError` before any file is read.

mod backfill;
mod gather;
mod request;
mod walk;
#[cfg(test)]
mod tests;

#[cfg(test)]
pub(crate) use request::collect;
pub(crate) use request::collect_checked;
pub(crate) use walk::{is_ignored_dir_name, is_supported_extension};
