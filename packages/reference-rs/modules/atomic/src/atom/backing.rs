//! Which systems back one authored style: the compiling system, or the named systems that render
//! the tag it was written on. A want or authored declaration on an own host is `Own` and lowers
//! under the compiling system's prefix; one on a component another system renders lowers under
//! each system its `Systems` list names, and under nothing else. An empty list means nothing this
//! compile composes can back it: the style resolves (so refusals still report) but prints nowhere.
//! On the wire `Own` is absent and `Systems` is the list of names, so the own path keeps its bytes.

use std::sync::Arc;

use serde::{Deserialize, Deserializer, Serialize, Serializer};

/// The systems one authored style lowers under.
#[derive(Debug, Clone, Default, PartialEq, Eq, Hash)]
pub enum Backing {
    /// The compiling system: an own host, a `css()` call, a recipe.
    #[default]
    Own,
    /// Another system renders the tag: one rule per named system, in
    /// composed order; empty when no composed system backs it.
    Systems(Arc<[Box<str>]>),
}

/// The own backing, borrowable for the life of the program.
pub static OWN: Backing = Backing::Own;

impl Backing {
    /// Systems built from names, in the order given.
    pub fn systems<I, S>(names: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<Box<str>>,
    {
        Self::Systems(names.into_iter().map(Into::into).collect())
    }

    /// The backing that names no system: nothing this compile composes
    /// prints the style.
    pub fn none() -> Self {
        Self::Systems(Arc::from([]))
    }

    /// True for the compiling system's own styles.
    pub fn is_own(&self) -> bool {
        matches!(self, Self::Own)
    }

    /// The named systems; empty for `Own`.
    pub fn named(&self) -> &[Box<str>] {
        match self {
            Self::Own => &[],
            Self::Systems(names) => names,
        }
    }

    /// Every system a style backed this way prints under: `own` for `Own`,
    /// else each named system.
    pub fn targets<'a>(&'a self, own: &'a str) -> impl Iterator<Item = &'a str> {
        let own_target = std::iter::once(own).take(usize::from(self.is_own()));
        own_target.chain(self.named().iter().map(|name| &**name))
    }
}

impl Serialize for Backing {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        match self {
            Self::Own => serializer.serialize_none(),
            Self::Systems(names) => serializer.collect_seq(names.iter()),
        }
    }
}

impl<'de> Deserialize<'de> for Backing {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let names = Option::<Vec<Box<str>>>::deserialize(deserializer)?;
        Ok(names.map_or(Self::Own, |names| Self::Systems(names.into())))
    }
}

#[cfg(test)]
mod tests {
    use super::Backing;

    #[test]
    fn own_targets_the_compiling_system_and_systems_target_their_names() {
        let own: Vec<_> = Backing::Own.targets("app").collect();
        assert_eq!(own, ["app"]);
        let backing = Backing::systems(["reference-icons", "reference-ui"]);
        let named: Vec<_> = backing.targets("app").collect();
        assert_eq!(named, ["reference-icons", "reference-ui"]);
        assert_eq!(Backing::none().targets("app").count(), 0);
    }

    #[test]
    fn the_wire_carries_names_and_reads_absent_as_own() {
        let backing = Backing::systems(["acme"]);
        let text = serde_json::to_string(&backing).expect("serializes");
        assert_eq!(text, r#"["acme"]"#);
        assert_eq!(serde_json::from_str::<Backing>(&text).ok(), Some(backing));
        assert_eq!(
            serde_json::from_str::<Backing>("null").ok(),
            Some(Backing::Own)
        );
    }
}
