# Check tanaabot’s saved instructions

## Cloud worker

Resolve canonical `tanaabased/tanaabot` `main` once to a full commit through the authorized
repository connection. Follow `skills/instruction-sync/references/source.md` at that commit.
Read `dotfiles/ai/.codex/AGENTS.md` first, then every top-level `instructions/*.md` in ascending
path order. Verify the complete listing and reads at the same commit, along with the pinned
Instruction Sync skill and required resources. Return the verified commit, ordered source
inventory and any preparation failure privately to the owning Dot. An incomplete listing or
read blocks the proposal. Finish preparation so the coordinator can continue. Report the
main Dot comparison as pending until a result is received.

## Owning Dot

Verify this run's handoff and the main tanaabot Dot target. If preparation failed or is
incomplete, report the specific blocker in the shared card style and stop before comparison.
Otherwise read and follow
`skills/instruction-sync/SKILL.md` and its required references at the returned commit. Use that
commit and inventory without resolving `main` again. Compare the complete saved document with
the complete desired source. Start a private migration review if the first replacement still
needs it. Otherwise reuse a matching pending proposal or show the exact full replacement and
its removals in the main Dot. The occurrence can compare and propose only. A later operator
reply approving the exact document in the main Dot begins save and readback. A matching
saved document needs no approval or write.

Use both layouts in `skills/instruction-sync/references/results.md`. Send the outcome and
sanitized changes grouped by source file to this automation’s worker through a result-only
handoff. Keep the complete saved document, migration review, exact proposal and approval in
the main Dot. Deliver one compact main-chat card with the outcome, action needed, verified
worker link and contextual status. Report blocked checks, failures and unavailable delivery
through the same route. Report an approved save without starting another scheduled run.
