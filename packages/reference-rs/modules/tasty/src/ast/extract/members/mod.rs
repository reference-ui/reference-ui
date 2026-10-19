//! Member extraction wiring.
//! Declares the signature-dispatch, conversion, and accessor-fold passes that turn signatures into TsMember values.

mod accessors;
mod dispatch;
mod signatures;

pub(super) use dispatch::{members_from_signatures, members_from_signatures_in};
