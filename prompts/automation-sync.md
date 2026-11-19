# Synchronize repository automations

Use the selected Tanaabot Cloud environment for the source preparation and assembly below.
Read and follow `skills/automation-sync/SKILL.md` and its required references from the
verified source snapshot. Pass the originating `sourceSelection` to the assembler.
Synchronize all declared automations unless the coordinator supplies a narrower selection.
Preserve that selection when resuming after worker recovery.

The skill supplies the dependency preparation, task assembly, native schedule comparison and
verification. It uses the Agent System Git dependency locked by this Tanaabot revision; do not
replace it with a registry release or a private parser. Do not run machine provisioning or Install.

Resolve desired worker settings through the current skill and match them against verified native
environments and saved worker bindings. Never substitute local execution or replace a worker after
an environment mismatch. A stored enabled:false definition remains
paused. Enabling a definition requires an operator-authorized source change and synchronization;
never edit a prepared task object to override its desired state.

If this Cloud worker lacks native scheduling tools, return the prepared actions to the owning
dot along with the complete source selection for application through its supported controls.
Report that handoff as pending until the native
operation succeeds. If unattended application is unsupported, report the limitation and the skill's
manual update procedure. Do not silently claim synchronization or enqueue a substitute schedule.

## Result and dot summary

After verified native application and the skill's final sidebar placement pass, put the configuration cards in the affected workers using the
skill's display-only procedure. Titles use the authored name and `· CREATED` or `· UPDATED`.
Then display one `AUTOMATION SYNC · RUN RESULTS` card in the sync worker, following the
configuration-results reference. Include every considered automation and its verified outcome;
keep this separate from sync's own `CREATED` or `UPDATED` configuration card. When
application belongs to the coordinator, return the exact prepared actions through tool output
or a private handoff artifact, including when all schedules are unchanged. Leave configuration
results pending until the coordinator verifies the outcome.

The applying context follows the skill's configuration-results reference for main-chat delivery.
When no schedules were created or updated, return one compact Automation Sync card after the
placement pass. Include any verified moves or placement issues. Preserve missing-tool handoffs
as pending and use the host's normal result delivery.
