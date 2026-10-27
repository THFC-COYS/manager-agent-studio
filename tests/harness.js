/* Node harness for Manager Agent Studio.
   Extracts the pure <script id="agent-core"> block from index.html and
   asserts its behavior. Run: node tests/harness.js
   The fixture is a scripted manager profile with a heavy one-on-one
   load, mirroring the sample profile in the studio. */
"use strict";
var fs = require("fs"), os = require("os"), path = require("path");

var html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
var m = html.match(/<script id="agent-core">([\s\S]*?)<\/script>/);
if (!m) { console.error("agent-core block not found"); process.exit(1); }
var tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "mas-")), "core.js");
fs.writeFileSync(tmp, m[1]);
var C = require(tmp);

var passed = 0, failed = 0, failures = [];
function check(name, cond) {
  if (cond) { passed++; }
  else { failed++; failures.push(name); console.log("FAIL: " + name); }
}
function includes(name, hay, needle) { check(name, typeof hay === "string" && hay.indexOf(needle) >= 0); }
function excludes(name, hay, needle) { check(name, typeof hay === "string" && hay.indexOf(needle) < 0); }
function near(name, a, b) { check(name, Math.abs(a - b) < 0.001); }

/* ---------- shared fixture: heavy one-on-one load ---------- */
var CFG = {
  managerName: "Priya Nair", title: "Engineering manager, platform team",
  teamSize: 8, ownerName: "Priya Nair",
  audit: {
    morningbrief:      { hours: "h12", drain: "tedious" },
    commitments:       { hours: "h34", drain: "dread" },
    chasing:           { hours: "h12", drain: "fine" },
    oooprep:           { hours: "h5p", drain: "dread" },
    ooonotes:          { hours: "h34", drain: "tedious" },
    ooocontext:        { hours: "h34", drain: "fine" },
    decisionlog:       { hours: "lt1", drain: "fine" },
    decisionresurface: { hours: "lt1", drain: "fine" },
    decisionmemos:     { hours: "h12", drain: "fine" },
    statusup:          { hours: "h12", drain: "fine" },
    staffmeetings:     { hours: "h12", drain: "fine" },
    reviews:           { hours: "lt1", drain: "fine" },
    interviews:        { hours: "lt1", drain: "fine" }
  },
  modules: null,
  agentName: "Atlas", identity: "",
  bearings: ["discreet", "calm"], values: ["trust", "confidences"], valuesText: "",
  neverDo: ["noshare1on1", "noconfidential"],
  neverDoText: "Never book a one-on-one over a team member's focus block",
  voiceSample: "",
  matrix: {},
  escalation: "Flag it in the morning brief and message me directly with the decision needed."
};
var PKG = C.buildManagerPackage(CFG);

/* ================= Catalogs ================= */
check("C01 four audit groups", C.AUDIT_GROUPS.length === 4);
check("C02 thirteen audit items", C.AUDIT_ITEMS.length === 13);
check("C03 every item maps to a real module", C.AUDIT_ITEMS.every(function(i){ return !!C.moduleById(i.module); }));
check("C04 every item maps to a real group", C.AUDIT_ITEMS.every(function(i){ return !!C.groupById(i.group); }));
check("C05 four stack modules", C.MODULES.length === 4);
check("C06 module ids in stack order", C.MODULES.map(function(x){ return x.id; }).join(",") === "morning,oneonone,decisions,followthrough");
check("C07 Follow-Through jobs carry the Friday receipt", C.moduleById("followthrough").jobs.join(" ").indexOf("Friday receipt") >= 0);
check("C08 five hour chips", C.HOUR_CHIPS.length === 5);
check("C09 reclaim rate is 0.6", C.RECLAIM_RATE === 0.6);
check("C10 seven matrix actions", C.MATRIX_ACTIONS.length === 7);
check("C11 four matrix levels", Object.keys(C.MATRIX_LEVELS).length === 4);

/* ================= Scoring ================= */
check("S01 hoursValue reads a chip", C.hoursValue("h34") === 3.5);
check("S02 hoursValue reads a number", C.hoursValue(2) === 2);
check("S03 hoursValue none chip is zero", C.hoursValue("none") === 0);
var SA = C.scoreAudit(CFG);
near("S04 fixture total hours", SA.totalHours, 26);
near("S05 fixture reclaim is 60 percent", SA.reclaimed, 15.6);
var prep = SA.items.filter(function(i){ return i.id === "oooprep"; })[0];
near("S06 score is hours x drain x fit", prep.score, 6 * 1.8 * 0.95);
var ONLY = { audit: {} };
C.AUDIT_ITEMS.forEach(function(i){ ONLY.audit[i.id] = { hours: "none", drain: "fine" }; });
ONLY.audit.oooprep = { hours: 10, drain: "fine" };
var SA2 = C.scoreAudit(ONLY);
check("S07 single routine total", SA2.totalHours === 10);
check("S08 single routine reclaim is 6", SA2.reclaimed === 6);
check("S09 single routine ranked alone", SA2.ranked.length === 1);

/* ================= Opportunities and defaults ================= */
var OPPS = C.rankOpportunities(CFG);
check("O01 top opportunity is a one-on-one routine", OPPS[0].itemId === "oooprep");
check("O02 top opportunity maps to One-on-One Prep", OPPS[0].module === "oneonone" && OPPS[0].moduleName === "One-on-One Prep");
check("O03 default modules cover top two scored areas", JSON.stringify(C.defaultModules(CFG)) === JSON.stringify(["oneonone", "followthrough"]));
check("O04 resolveModules honors explicit toggles", JSON.stringify(C.resolveModules({ modules: ["decisions"], audit: CFG.audit })) === JSON.stringify(["decisions"]));
check("O05 resolveModules never returns empty", C.resolveModules({ modules: [], audit: {} }).length >= 1);
check("O06 module scores rank one-on-one highest", (function(){ var ms = C.moduleScores(CFG); return ms.oneonone > ms.morning && ms.oneonone > ms.decisions; })());

/* ================= The package: structure ================= */
check("P01 package generates with an owner", PKG.length > 0);
var i1 = PKG.indexOf("=== SECTION 1: WHO YOUR AGENT IS ===");
var i2 = PKG.indexOf("=== SECTION 2: WHAT YOUR AGENT DOES ===");
var i3 = PKG.indexOf("=== SECTION 3: WHERE YOU STAY IN CHARGE ===");
check("P02 three section headers present", i1 >= 0 && i2 >= 0 && i3 >= 0);
check("P03 section headers in order", i1 < i2 && i2 < i3);
includes("P04 agent name in package", PKG, "Name: Atlas");
includes("P05 team size in identity", PKG, "chief of staff to a manager of 8 people");
includes("P06 reclaim estimate in section 2", PKG, "60 percent reclaim rate");
includes("P07 Friday receipt present when Follow-Through on", PKG, "Friday receipt");
includes("P08 sample Monday brief in package", PKG, "MONDAY MORNING BRIEF (sample");
includes("P09 owner line in section 3", PKG, "Accountable owner: Priya Nair");
check("P10 zero em dashes in package", PKG.indexOf("\u2014") < 0); // needle is the em dash character itself

/* ================= Module toggling ================= */
var MORNING_ONLY = Object.assign({}, CFG, { modules: ["morning"] });
var PKG_M = C.buildManagerPackage(MORNING_ONLY);
includes("T01 morning module line present when on", PKG_M, "The day, prepared before it starts.");
excludes("T02 one-on-one module line absent when off", PKG_M, "Walk into every one-on-one already knowing the person.");
excludes("T03 Follow-Through line absent when off", PKG_M, "No promise ages in silence.");
excludes("T04 Friday receipt absent when Follow-Through off", PKG_M, "Friday receipt");
var BRIEF_OOO = C.buildMondayBrief(Object.assign({}, CFG, { modules: ["oneonone"] }));
includes("T05 Monday brief shows one-on-one block", BRIEF_OOO, "YOUR ONE-ON-ONES");
excludes("T06 Monday brief hides receipt block when off", BRIEF_OOO, "FRIDAY RECEIPT");
var BRIEF_FT = C.buildMondayBrief(Object.assign({}, CFG, { modules: ["followthrough"] }));
includes("T07 Monday brief shows receipt block when on", BRIEF_FT, "COMMITMENTS AND THE FRIDAY RECEIPT");

/* ================= The soul ================= */
includes("L01 preset never-do lands in package", PKG, "Never share one person's one-on-one notes with anyone else");
includes("L02 free-text never-do lands verbatim", PKG, "Never book a one-on-one over a team member's focus block");
includes("L03 bearing prompt lands in package", PKG, "What is shared in confidence stays in confidence");
includes("L04 value prompt lands in package", PKG, "Protect the team's trust");
var EDITED = Object.assign({}, CFG, { voiceSample: "Custom voice line, written by the manager, calm and short." });
check("L05 edited voice sample resolves exactly", C.resolveVoiceSample(EDITED) === "Custom voice line, written by the manager, calm and short.");
includes("L06 edited voice sample ships in package", C.buildManagerPackage(EDITED), "Custom voice line, written by the manager, calm and short.");
check("L07 generated voice sample is non-empty", C.buildVoiceSample(CFG).length > 20);
check("L08 blank name falls back to a default", C.resolveAgentName({ agentName: "  " }) === C.DEFAULT_AGENT_NAME && C.DEFAULT_AGENT_NAME.length > 0);
includes("L09 blank name still ships named in package", C.buildManagerPackage(Object.assign({}, CFG, { agentName: "" })), "Name: " + C.DEFAULT_AGENT_NAME);
check("L10 teamPhrase without a size stays generic", C.teamPhrase({}) === "a people manager");
check("L11 generated identity carries the name", C.defaultIdentity(CFG).indexOf("You are Atlas, chief of staff") === 0);
check("L12 zero em dashes in Monday brief", C.buildMondayBrief(CFG).indexOf("\u2014") < 0);

/* ================= Approvals and the owner gate ================= */
function defOf(id){ return C.MATRIX_ACTIONS.filter(function(a){ return a.id === id; })[0].def; }
check("A01 send to team defaults to ask", defOf("sendMessage") === "ask");
check("A02 share outside defaults to ask", defOf("shareOutside") === "ask");
check("A03 nudge a person defaults to ask", defOf("nudgePerson") === "ask");
check("A04 drafting defaults to free", defOf("draftMessage") === "free");
check("A05 summarizing own records defaults to free", defOf("summarizeOOO") === "free");
includes("A06 default send rule renders as ask first", PKG, "- Send a message to my team: Always ask first");
includes("A07 default draft rule renders as runs freely", PKG, "- Draft a message to my team: Runs freely");
includes("A08 confidentiality rule outranks the matrix", PKG, "CONFIDENTIALITY");
check("A09 no owner, no package", C.buildManagerPackage(Object.assign({}, CFG, { ownerName: "" })) === "");
check("A10 owner gate explains itself", C.ownerGate({ ownerName: " " }).ok === false && C.ownerGate({ ownerName: " " }).message.indexOf("No owner, no agent") === 0);
check("A11 owner gate passes with a name", C.ownerGate(CFG).ok === true);

console.log("Manager Agent Studio harness: " + passed + " passed, " + failed + " failed, " + (passed + failed) + " total");
if (failed) { console.log("Failures: " + failures.join(" | ")); process.exit(1); }
