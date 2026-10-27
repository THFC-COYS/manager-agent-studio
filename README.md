# Manager Agent Studio

The Manager edition of the Studio line. Manager Agent Studio helps a people manager design a Muse agent that works as their chief of staff, running the modules of the **Manager Impact Stack** the manager chooses, inside approval rules the manager sets, with a soul the manager writes.

Sibling studios: Owner Agent Studio (a governed personal agent for owners), CourseAgent Studio (the same pattern for faculty), and Muse Switch Kit (bring an existing AI setup over to Muse).

## Who it is for

People managers: team leads, department heads, and anyone whose week is preparation, memory, and follow-through on behalf of a team. No prompt engineering assumed. The studio takes about five minutes.

## The Manager Impact Stack mapping

The audit in Step 1 rates thirteen concrete manager routines in four groups (Running the team, One-on-ones, Decisions, Reporting and admin). Each routine is scored by time (hours per week) times how draining it feels times how much of it an agent can genuinely carry. Every routine feeds one stack module:

| Module | What the agent does | Fed by audit routines |
| --- | --- | --- |
| Morning Brief | Overnight changes, today's meetings with context, open loops in priority order | Morning brief prep, status updates upward, staff meeting prep |
| One-on-One Prep | Last notes resurfaced, open commitments both ways, talking points, things to celebrate and things to raise carefully | One-on-one prep, note capture, remembering each person, review drafting |
| Decision Log | Decisions captured with rationale and owner, resurfaced when context changes | Decision logging, decision resurfacing, decision memos |
| Follow-Through | Every promise watched, nudges before deadlines, a Friday receipt of kept and slipped commitments | Commitment tracking, chasing updates, interview scheduling and scorecards |

The reclaim estimate uses a conservative 60 percent planning rate, labeled as an estimate everywhere it appears.

## The flow

1. **Find.** Rate your manager week: time chips and energy chips per routine. The studio scores where an agent helps most.
2. **The Stack.** Your top opportunities, mapped to the four modules. Toggle which modules your agent runs (at least one; the default covers your top two scored areas).
3. **Soul.** Name the agent, write its identity ("You are NAME, chief of staff to a manager of N people: ..."), pick its bearings and values, set never-do rules in preset form and in your own words (your words land in the package verbatim), and approve the voice sample line it will speak in.
4. **Approvals and your brief.** Set the approval matrix (send, share outside the team, and nudging a person default to Always ask first; drafting and summarizing for your own records default to Runs freely), name the accountable manager, and copy the final package.

The package has three sections, in order: **Section 1: Who your agent is** (the soul), **Section 2: What your agent does** (system prompt, the stack with the audit behind it, and a sample Monday morning brief generated from your choices), **Section 3: Where you stay in charge** (the approval matrix as standing orders, the confidentiality rule that outranks the matrix, and the owner line).

## Governance rules built in

- **No owner, no agent.** The package will not generate until a named accountable manager exists.
- **Confidentiality outranks the matrix.** One-on-one notes and anything marked confidential are never shared, at any approval level.
- **Your words are verbatim.** Free-text never-do rules and the voice sample line you approve ship exactly as written.

## Honesty notes

- Copy and paste is the bridge today. There is no Muse login or provisioning API yet, so the studio does not transfer anything automatically: you copy the package and paste it into Muse yourself.
- The conversion from audit to stack is rule-based and visible. Scores, the reclaim rate, and module jobs are all printed in the package, not hidden.
- The studio runs entirely in your browser. Nothing you type is sent anywhere; your work autosaves to localStorage on your device only.

## Run it locally

Open `index.html` in any browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Tests

```sh
node tests/harness.js
```

The harness extracts the pure `agent-core` script block from `index.html` and asserts the catalogs, the scoring math (including the 60 percent reclaim), opportunity ranking for a heavy one-on-one profile, module toggling effects on the package, the three-section output, the verbatim soul fields, the conservative approval defaults, the owner gate, and zero em dashes in generated output.
