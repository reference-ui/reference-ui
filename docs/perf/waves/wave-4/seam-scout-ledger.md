# seam-scout raw query ledger (aside; REPORT.md is the deliverable)
# base c593829d3a2b6382d7150410a05a470159f40616; bundles enterprise-repro4a/b (base 6f4cf1ba)
# RS tree identical across range for seam: git diff 6f4cf1ba..HEAD -- packages/ = MCP icons + tsup + neo reports only
compile bucket: 518wt both captures (518 samples)
__napi__compile_system: 500/500 incl, self 0, caller FunctionCallbackWrapper 500/500
  4a callees: compile 475 + dropResult 7 + FromNapi 6 + from_trait 4 + serialize 4 + from_json 1 + dropRequest 1 + free_medium 1 (=499; ToNapi 1 truncated 9th) = 500
  4b callees: compile 476 + dropResult 6 + FromNapi 5 + serialize 4 + from_trait 3 + from_json 2 + dropRequest 2 + ToNapi 2 = 500
FromNapiValue: 6/5 (callee napi_get_value_string_utf8 6/5 -> WriteUtf8V2 4/3 + Utf8Length 2/2)
ToNapiValue: 1/2 (callee napi_create_string_utf8 1/2 -> NewFromUtf8 1/2)
from_trait: 5/4 (callers: napi-entry 4/3 + EvaluatedSystemSpec::from_json 1/1)
serialize (refvirt atomic): 4/4 (callees: split_shared_suffix 2/2 + ser-entry 1-2)
Builtin_JsonStringify compile: 11/11; publish: 9/8 (publish = own emission, fenced out)
Builtin_JsonParse compile: 3/4; publish 4a: 1, 4b: 0
SlowFlatten: compile 0/0; 4a: startup 1 + scan 7 + publish 2; all-phase 4a 9+1+1, 4b 6
emit_dts_sync: all 1wt, phase = publish (typegen; outside fence)
napi whole-profile candidates: only compile_system + glue + emit_dts (no other __napi__ frames)
reconciliation: 4a 475+25+18=518 (in-napi 7+5+4+8+1=25 with ToNapi; JS 11+3+4=18); 4b 476+24+18=518 (JS 11+4+3=18)
static: 1 napi export (native.rs:38); ATOMIC_NATIVE_EXPORTS=['compileSystem']; 1 call site sync/index.ts:120; 1 stringify index.ts:45; 1 parse native.ts:27
MARSHAL census: req 6,153,775 (files 5,662,338/15122 + spec 19,058); res diet 3,144,558 (sheet 2,867,925 + head 1,162 + runtime 214,325)
