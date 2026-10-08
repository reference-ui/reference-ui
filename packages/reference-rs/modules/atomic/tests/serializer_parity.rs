//! Differential fuzzing for the scalar lookup-key fast frame: seeded PRNG
//! tuples plus container shapes, every case byte-compared under each live
//! `W` against the landed diet body kept here as the oracle. Takes no
//! inputs and emits only pass/fail; determinism comes from the fixed seeds,
//! so any failure reproduces exactly.

use atomic::runtime::serializer::{
    canonical_json_value, serialize_lookup_key, LookupKey, WhenSteps,
};
use serde_json::Value;

/// Landed-diet body kept as the differential oracle.
fn serde_tuple_diet<W: serde::Serialize + ?Sized>(key: &LookupKey<'_, W>) -> String {
    let canonical_val;
    let value = match key.value {
        Value::Object(_) | Value::Array(_) => {
            canonical_val = canonical_json_value(key.value);
            &canonical_val
        }
        scalar => scalar,
    };
    let tuple = (key.system, key.when, key.prop, value, key.important);
    serde_json::to_string(&tuple).unwrap_or_else(|_| String::new())
}

fn assert_parity<W: serde::Serialize + WhenSteps + ?Sized>(key: &LookupKey<'_, W>) {
    let fast = serialize_lookup_key(key);
    let want = serde_tuple_diet(key);
    assert_eq!(fast, want, "divergence for value {:?}", key.value);
}

/// Check one case under every live `W` and both important parities:
/// borrowed slice, owned vec, and boxed slice (the production paths).
fn assert_parity_all(system: &str, when: &[String], prop: &str, value: &Value) {
    let owned = when.to_vec();
    let boxed: Vec<Box<str>> = when.iter().map(|step| step.as_str().into()).collect();
    for important in [false, true] {
        assert_parity(&LookupKey::new(system, when, prop, value).with_important(important));
        assert_parity(&LookupKey {
            system,
            when: &owned,
            prop,
            value,
            important,
        });
        assert_parity(&LookupKey {
            system,
            when: boxed.as_slice(),
            prop,
            value,
            important,
        });
    }
}

/// Deterministic xorshift64* stream; fixed seed, no extra dependencies.
struct Rng(u64);

impl Rng {
    fn next(&mut self) -> u64 {
        let mut x = self.0;
        x ^= x >> 12;
        x ^= x << 25;
        x ^= x >> 27;
        self.0 = x;
        x.wrapping_mul(0x2545_F491_4F6C_DD1D)
    }

    fn below(&mut self, bound: usize) -> usize {
        (self.next() % bound.max(1) as u64) as usize
    }
}

const PIECES: &[&str] = &[
    "a", "Z", "0", "9", "-", "_", ".", "/", ":", " ", "$", "{", "}", "[", "]", "\"", "\\", "\n",
    "\t", "\r", "\x00", "\x08", "\x1f", "\x7f", "\u{9f}", "é", "🦀", "\u{0301}", "整个",
    "\u{2028}", "\u{2029}",
];

const NUMBERS: &[&str] = &[
    "0",
    "1",
    "-1",
    "1.0",
    "-0.0",
    "0.0",
    "1e300",
    "5e-324",
    "0.30000000000000004",
    "3.141592653589793",
    "123456789012345678901234567890",
    "18446744073709551615",
    "-9223372036854775808",
];

fn rand_text(rng: &mut Rng, max_pieces: usize) -> String {
    let mut out = String::new();
    for _ in 0..rng.below(max_pieces + 1) {
        out.push_str(PIECES[rng.below(PIECES.len())]);
    }
    out
}

fn rand_scalar(rng: &mut Rng) -> Value {
    match rng.below(100) {
        0..=74 => Value::String(rand_text(rng, 24)),
        75..=79 => Value::Bool(rng.below(2) == 0),
        80..=82 => Value::Null,
        _ => {
            serde_json::from_str::<Value>(NUMBERS[rng.below(NUMBERS.len())]).unwrap_or(Value::Null)
        }
    }
}

fn rand_container(rng: &mut Rng, depth: usize) -> Value {
    if rng.below(2) == 0 {
        let mut items = Vec::new();
        for _ in 0..rng.below(5) {
            items.push(rand_value(rng, depth));
        }
        return Value::Array(items);
    }
    let mut map = serde_json::Map::new();
    for _ in 0..rng.below(5) {
        map.insert(rand_text(rng, 6), rand_value(rng, depth));
    }
    Value::Object(map)
}

fn rand_value(rng: &mut Rng, depth: usize) -> Value {
    if depth < 2 && rng.below(100) < 30 {
        rand_container(rng, depth + 1)
    } else {
        rand_scalar(rng)
    }
}

#[test]
fn scalar_fast_frame_fuzz_matches_diet_on_every_w() {
    let mut rng = Rng(0x51ED_4A50_4E9E_01u64);
    for _ in 0..30_000 {
        let system = rand_text(&mut rng, 8);
        let when: Vec<String> = (0..rng.below(4)).map(|_| rand_text(&mut rng, 6)).collect();
        let prop = rand_text(&mut rng, 8);
        let value = rand_scalar(&mut rng);
        assert_parity_all(&system, &when, &prop, &value);
    }
}

#[test]
fn container_fallback_fuzz_matches_diet_on_every_w() {
    let mut rng = Rng(0x0B1E_C7A5_C04E_02u64);
    for _ in 0..5_000 {
        let system = rand_text(&mut rng, 8);
        let when: Vec<String> = (0..rng.below(4)).map(|_| rand_text(&mut rng, 6)).collect();
        let prop = rand_text(&mut rng, 8);
        let value = rand_container(&mut rng, 0);
        assert_parity_all(&system, &when, &prop, &value);
    }
}

#[test]
fn when_steps_match_diet_on_every_byte_value() {
    let value = Value::String("v".to_string());
    for byte in 0..=255u32 {
        let ch = char::from_u32(byte).unwrap_or('\u{FFFD}');
        for step in [
            ch.to_string(),
            format!("_{ch}"),
            format!("{ch}_"),
            format!("a{ch}b🦀{ch}"),
        ] {
            let when = vec![step, "plain".to_string()];
            assert_parity_all("sys", &when, "prop", &value);
            assert_parity_all("s\"ys", &when[..1], "p\n", &value);
        }
    }
}

#[test]
fn scalar_values_match_diet_on_every_byte_value() {
    let when = ["_hover".to_string(), "a\"b".to_string()];
    for byte in 0..=255u32 {
        let ch = char::from_u32(byte).unwrap_or('\u{FFFD}');
        for text in [
            ch.to_string(),
            format!("a{ch}"),
            format!("{ch}b"),
            format!("a{ch}b🦀{ch}"),
        ] {
            let value = Value::String(text);
            assert_parity_all("lib-test-system", &when, "color", &value);
            assert_parity_all("sys\"\\\n", &[], "p\x00\x1f", &value);
        }
    }
}

#[test]
fn adversarial_cases_match_diet_on_every_w() {
    let num = |text: &str| serde_json::from_str::<Value>(text).unwrap_or(Value::Null);
    let steps: Vec<String> = ["_hover", "x\ny\x00z", "\"\\", "\x08\x0c\r\n\t", "🦀", ""]
        .iter()
        .map(ToString::to_string)
        .collect();
    let long = "x".repeat(8000);
    let controls: String = (0..32u32)
        .map(|b| char::from_u32(b).unwrap_or('?'))
        .collect();
    let cases: Vec<Value> = vec![
        Value::String(String::new()),
        Value::String("\"".to_string()),
        Value::String("\\".to_string()),
        Value::String("\"\\\"\\\\\\\"".to_string()),
        Value::String(controls),
        Value::String(
            "\u{e9}\u{1f980}\u{0301}\u{6574}\u{4e2a}\u{2028}\u{2029}\x7f\u{9f}".to_string(),
        ),
        Value::String(long),
        Value::String("a\"b\\c\nd\te\rf\x08f\x0cg".to_string()),
        Value::Null,
        Value::Bool(true),
        Value::Bool(false),
        num("0.0"),
        num("-0.0"),
        num("1"),
        num("1.0"),
        num("1e300"),
        num("5e-324"),
        num("0.30000000000000004"),
        num("123456789012345678901234567890"),
        num("18446744073709551615"),
        serde_json::json!({}),
        serde_json::json!([]),
        serde_json::json!({"b": {"z": 9, "y": [1, {"a": null}]}, "a": true}),
        serde_json::json!({"a": true, "b": {"y": [1, {"a": null}], "z": 9}}),
        serde_json::json!(["1", null, "a\"b", {"k": "v\n"}]),
    ];
    for value in &cases {
        assert_parity_all("s\"ys\\tem", &steps, "pr\x00op", value);
        assert_parity_all("", &["\x00\x1f\x7f".to_string()], "", value);
    }
}
