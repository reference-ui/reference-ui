# STT-WRAP-11 — Component names with a non-ASCII capital first letter trace, and empty or BOM-only files stay silent

`umlaut` exports `Ärger` (a non-ASCII capital first letter) and `Kärtchen` (a non-ASCII letter later in the name); both forward StyleProps into Div.
`empty` is zero bytes and `bom` holds only a UTF-8 byte-order mark. Both parse to nothing.
The trace returns both umlaut names, sorted (STT-28), and emits no diagnostic at all: only an unparsable file warns (STT-24).

> Search terms: unicode, umlaut, capital letter, BOM, empty file, silent
