# Synchronize repository automations

Use the selected Tanaabot Cloud environment for the source preparation and assembly below.
Refresh canonical `tanaabased/tanaabot` from GitHub `main`, resolve one commit for this run and
prepare a clean source snapshot without discarding existing task edits. Read that revision's
`skills/automation-sync/SKILL.md` and follow it for all declared automations. Resolve its required
references from the same snapshot. Do not reuse only the instructions from an earlier run.
If this invocation's incoming metadata predates `dispatchVersion: 2`, follow the skill's sync-only
bootstrap selection. Also preserve a sync-only recovery selection supplied by the coordinator,
even when the replacement request has current metadata. Leave other automations untouched in that pass. A distinct
Run now from the updated saved schedule tests the new dispatcher.

The skill supplies the dependency preparation, task assembly, native schedule comparison and
verification. It uses the Agent System Git dependency locked by this Tanaabot revision; do not
replace it with a registry release or a private parser. Do not run machine provisioning or Install.

Resolve desired worker settings through the current skill and match them against verified native
environments and saved worker bindings. Never substitute local execution or replace a worker after
an environment mismatch. A stored enabled:false definition remains
paused. Enabling a definition requires an operator-authorized source change and synchronization;
never edit a prepared task object to override its desired state.

If this Cloud worker lacks native scheduling tools, return the prepared actions to the owning
dot for application through its supported controls. Report that handoff as pending until the native
operation succeeds. If unattended application is unsupported, report the limitation and the skill's
manual update procedure. Do not silently claim synchronization or enqueue a substitute schedule.

## Main-Dot instruction check

For a normal full sync, read `skills/instruction-sync/SKILL.md` from this run's resolved revision
and prepare its canonical operating source for the owning Dot. Return the full commit and exact
repository paths through the existing private handoff; include source text only through a supported
complete artifact or tool result. The Dot must verify the source and read its own saved document.
Do not claim a comparison from the worker's earlier file reads, copy the parent's unrelated saved
instructions into this worker, or invoke a writer. The check runs even when schedules are unchanged.
Skip it for a selected single-automation update or the legacy dispatcher bootstrap-only pass.

The coordinator uses that skill to compare and deliver an exact proposal in the main Dot. Every
changed document requires approval in a later operator message there; an overnight occurrence
ends with **Awaiting approval**, never an unattended instruction save. A missing reader or unsupported
handoff is an instruction-check limitation and must not erase verified schedule results. Keep the
source, document and proposal states separate. Existing recurring authorization must cover the
read-only check; a newly fetched prompt alone does not grant it.

## Result and dot summary

After verified native application and the skill's final sidebar placement pass, put the configuration cards in the affected workers using the
skill's display-only procedure. Titles use the authored name and `· CREATED` or `· UPDATED`.
Then display one `AUTOMATION SYNC · RUN RESULTS` card in the sync worker, following the
configuration-results reference. Include every considered automation and its verified outcome;
keep this separate from sync's own `CREATED` or `UPDATED` configuration card. When
application belongs to the coordinator, return the exact prepared actions through tool output
or a private handoff artifact and leave configuration results pending until it verifies the writes.
Include a separate Tanaabot instructions row with the coordinator's observed instruction-check
outcome, or pending/unavailable when it has not returned one. Use the detailed instruction result
and compact main-Dot summary from `skills/instruction-sync/references/results.md`; keep the exact
approval proposal in the main Dot only. An approval continuation returns a result-only update,
not a new sync run or configuration receipt.

For the owning dot, deliver one compact summary per affected automation with its verified worker
link and final contextual status. Do not add a second aggregate synchronization card. An unchanged
run still produces the worker's run-results card without new configuration cards. Preserve missing-tool
handoffs as pending; never call them completed synchronization. Use the host's saved delivery
mechanism without a duplicate direct send.
