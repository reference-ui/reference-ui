// voyage-swarm.mjs — checked-in voyage mission script (see VOYAGE.md Start).
// Launch from a fresh session via the Workflow tool with scriptPath set to
// this file. Resume with scriptPath + resumeFromRunId; never retype it.
// Flow: captain recon (fenced levers) -> 14-lever isolated swarm ->
// split integration (A/B + merge) -> agent-perf DX retro -> synthesis.
export default async function workflow(host) {
  host.phase("Captain recon");
  host.log("voyage perf swarm starting");
  const captainSchema = {
    type: "object",
    required: ["complete", "levers", "evidence", "unresolved"],
    properties: {
      complete: { type: "boolean" },
      levers: { type: "array", items: { type: "string" } },
      evidence: { type: "array", items: { type: "string" } },
      unresolved: { type: "array", items: { type: "string" } }
    }
  };
  const workerSchema = {
    type: "object",
    required: ["complete", "lever", "verdict", "evidence", "unresolved"],
    properties: {
      complete: { type: "boolean" },
      lever: { type: "string" },
      verdict: { type: "string" },
      evidence: { type: "array", items: { type: "string" } },
      unresolved: { type: "array", items: { type: "string" } }
    }
  };
  const captain = await host.agent({
    input: "You are star-captain recon for VOYAGE.md perf swarm. Use inherited Work tools. Steps: 1) call read_skill for star-captain, then agent-perf. 2) locate voyage.md (search workspace, likely root or docs or .agents). Read it fully. 3) read perf-index via pnpm agentperf (list/status) to map already-done levers. 4) inspect packages/reference-rs hot sync() path briefly. Return JSON complete/evidence/unresolved plus levers: 14 distinct single-lever hypotheses for fuzzy search (small tight optimizations, each one lever, no mega-levers). Each lever one line: name + file/symbol hint + ground fence + why small-win. All levers must sit inside the voyage fenced ground (reference-rs Rust + N-API seam + compile path through reference-neo, scored on bench:neo enterprise, unless voyage.md shows HQ widened scope) — drift without a ruling is forbidden. Mark already-done in evidence, exclude from levers. If voyage.md missing, still return 14 levers from agent-perf + code inspection and note unresolved.",
    schema: captainSchema,
    label: "captain-recon"
  });
  const capFailed = captain === null || captain.error_kind;
  const capData = !capFailed && captain.data && typeof captain.data === "object" ? captain.data : null;
  const rawLevers = capData && Array.isArray(capData.levers) ? capData.levers.filter(Boolean) : [];
  const seen = new Set();
  const uniq = [];
  for (const l of rawLevers) {
    const k = String(l).slice(0, 200).trim();
    if (!k || seen.has(k.toLowerCase())) continue;
    seen.add(k.toLowerCase());
    uniq.push(k);
  }
  let idx = 1;
  while (uniq.length < 14) {
    uniq.push("open-hypothesis-" + (idx++) + ": own fuzzy lever from agent-perf + code inspection, must check perf-index first");
  }
  const levers = uniq.slice(0, 14);
  const capRef = captain ? captain.ref : null;
  host.phase("Perf swarm");
  host.log("spawning 14 lever workers: " + levers.length);
  const workers = await host.parallel(levers.map((lever, i) => ({
    input: "You are perf swarm worker " + (i+1) + "/14. Single lever ONLY: " + lever + ". Captain ref: " + (capRef || "none") + ". Steps: 1) read_skill agent-perf. 2) check perf-index (pnpm agentperf) + voyage.md to prove lever NOT already done; if done, return verdict CUT with evidence. 3) fuzzy search codebase for lever instances (use search, read bodies you cite). 4) implement minimal probe in your isolated worktree, bench with pnpm agentperf or agentrs perf path, compare before/after. 5) file verdict LAND/BANK/CUT/HOLD with numbers. 6) provision toolchain first (pnpm install in worktree); before filing, git status shows ONLY own files (foreign dirt = fence collision, disclose it). 7) end evidence with DX appendix: broke command + workaround + minutes lost + 1 fix proposal. Return complete/lever/verdict/evidence/unresolved. Evidence must include files opened + bench delta. Do NOT touch other levers. Isolated worktree: keep changes minimal.",
    schema: workerSchema,
    isolation: true,
    label: "lever-" + (i+1)
  })));
  const compact = workers.map((r, i) => {
    const failed = r === null || r.error_kind;
    const d = !failed && r.data && typeof r.data === "object" ? r.data : null;
    return {
      lever: levers[i],
      ref: r ? r.ref : null,
      verdict: d && typeof d.verdict === "string" ? d.verdict : (failed ? "WORKER_FAILED" : "NO_VERDICT"),
      complete: d ? d.complete === true : false,
      evidence: d && Array.isArray(d.evidence) ? d.evidence.filter(Boolean).slice(0, 12) : [],
      unresolved: d && Array.isArray(d.unresolved) ? d.unresolved.filter(Boolean).slice(0, 6) : [(failed ? "worker failed" : "missing data")]
    };
  });
  host.phase("Integrate");
  const halves = await host.parallel([0, 1].map((h) => ({
    input: "You are voyage integrator for workers " + (h*7+1) + "-" + (h*7+7) + " of 14. Inline worker reports (this is the complete evidence; there are no other refs to resolve): " + JSON.stringify(compact.slice(h*7, h*7+7)) + ". Rules: star-captain + agent-perf verdict bars LAND/BANK/CUT/HOLD. Adjudicate each verdict (agree/overrule with reason), flag duplicates/already-done, name stack candidates with bench deltas and files. Return complete/lever/verdict/evidence/unresolved where lever=integration-half, verdict=summary.",
    schema: workerSchema,
    label: "integrator-" + (h ? "B" : "A")
  })));
  const halfCompact = halves.map((r, i) => {
    const failed = r === null || r.error_kind;
    const d = !failed && r.data && typeof r.data === "object" ? r.data : null;
    return {
      half: i ? "B workers 8-14" : "A workers 1-7",
      ref: r ? r.ref : null,
      complete: d ? d.complete === true : false,
      evidence: d && Array.isArray(d.evidence) ? d.evidence.filter(Boolean).slice(0, 14) : [],
      unresolved: d && Array.isArray(d.unresolved) ? d.unresolved.filter(Boolean).slice(0, 6) : [(failed ? "half failed" : "missing data")]
    };
  });
  const synthesis = await host.agent({
    input: "You are voyage merge integrator. Two half-syntheses inline (complete evidence): " + JSON.stringify(halfCompact) + ". Full verdict table: " + JSON.stringify(compact.map(c => ({lever: c.lever, verdict: c.verdict}))) + ". Rules: star-captain + agent-perf bars. Produce the final verdict table, LAND order, stack/sum-confirm plan, and collision notes. Return complete/lever/verdict/evidence/unresolved where lever=integration, verdict=summary.",
    schema: workerSchema,
    label: "integrator-merge"
  });
  host.phase("Agent Perf retro");
  host.log("collecting agent-perf DX reports per worker");
  const retroWorkers = await host.parallel(compact.map((c, i) => ({
    input: "You are agent-perf DX retro collector for lever worker " + (i+1) + "/14. Worker ref: " + (c.ref || "none") + ". Lever: " + c.lever + ". Worker verdict: " + c.verdict + ". Steps: 1) call read_skill for agent-perf. 2) inspect the inline worker evidence (primary source; work from this, refs may not resolve): " + JSON.stringify(c.evidence) + ". Worker ref for provenance only: " + (c.ref || "none") + ". 3) extract every Agent Perf UX issue that worker hit: commands run, what broke/confused, error text, workarounds, time lost. If the worker report lacks DX detail, inspect the CLI surface (pnpm agentperf --help, perf-index) and infer likely friction from the evidence trail, marking inferred items INFERRED. 4) propose 1-3 concrete fixes. Return complete/lever/verdict/evidence/unresolved where lever = the same lever string, verdict = SMOOTH/FRICTION/BLOCKED, evidence = DX findings + fixes, unresolved = gaps.",
    schema: workerSchema,
    label: "retro-" + (i+1)
  })));
  const retroCompact = retroWorkers.map((r, i) => {
    const failed = r === null || r.error_kind;
    const d = !failed && r.data && typeof r.data === "object" ? r.data : null;
    return {
      lever: compact[i].lever,
      workerRef: compact[i].ref,
      ref: r ? r.ref : null,
      dx: d && typeof d.verdict === "string" ? d.verdict : (failed ? "RETRO_FAILED" : "NO_DX"),
      evidence: d && Array.isArray(d.evidence) ? d.evidence.filter(Boolean).slice(0, 10) : [],
      unresolved: d && Array.isArray(d.unresolved) ? d.unresolved.filter(Boolean).slice(0, 4) : [(failed ? "retro failed" : "missing data")]
    };
  });
  const retroSynthesis = await host.agent({
    input: "You are agent-perf DX synthesizer. 14 per-worker retro reports. Refs: " + retroCompact.map(c => c.ref).filter(Boolean).join(" ") + ". Compact (complete evidence): " + JSON.stringify(retroCompact).slice(0, 20000) + ". Rules: find PATTERNS (same failure/confusion across N workers), rank fixes by frequency x severity, separate tool bugs vs docs gaps vs workflow gaps. List concrete next-cycle improvements with owner hint (CLI/skill/docs). Return complete/lever/verdict/evidence/unresolved where lever=agent-perf-retro, verdict=summary.",
    schema: workerSchema,
    label: "retro-integrator"
  });
  return { status: "ok", captainRef: capRef, captainText: captain ? captain.text : null, workers: compact, synthesisRef: synthesis ? synthesis.ref : null, synthesisText: synthesis ? synthesis.text : null, synthesisData: synthesis ? synthesis.data : null, retro: retroCompact, retroSynthesisRef: retroSynthesis ? retroSynthesis.ref : null, retroSynthesisText: retroSynthesis ? retroSynthesis.text : null, retroSynthesisData: retroSynthesis ? retroSynthesis.data : null };
}