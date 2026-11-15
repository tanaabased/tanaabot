# Synchronize repository automations

Use the selected Tanaabot Cloud environment for the source preparation and assembly below.
Refresh canonical `tanaabased/tanaabot` from GitHub `main`, resolve one commit for this run and
prepare a clean source snapshot without discarding existing task edits. Read that revision's
`skills/automation-sync/SKILL.md` and follow it for all declared automations. Resolve its required
references from the same snapshot. Do not reuse only the instructions from an earlier run.

The skill supplies the dependency preparation, task assembly, native schedule comparison and
verification. It uses the Agent System Git dependency locked by this Tanaabot revision; do not
replace it with a registry release or a private parser. Do not run machine provisioning or Install.

Keep the verified environment and result destination from this task's native context. Do not
change them merely because repository metadata changed. A stored enabled:false definition remains
paused. Enabling a definition requires an operator-authorized source change and synchronization;
never edit a prepared task object to override its desired state.

If this Cloud worker lacks native scheduling tools, return the prepared actions to the owning
dot for application through its supported controls. Report that handoff as pending until the native
operation succeeds. If unattended application is unsupported, report the limitation and the skill's
manual update procedure. Do not silently claim synchronization or enqueue a substitute schedule.
