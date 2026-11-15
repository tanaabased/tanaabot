# Authorized smoke pilot

Run only in the operator-approved validation window. Keep both source definitions disabled by
default; activation, result delivery and any temporary settings need that window's explicit scope.
Do not run this during routine contributor validation or invent a separate state store.

1. Seed paused tasks through the sync skill. Use the native saved results to confirm distinct task
   IDs, 🤖 names, local-time schedules, selected execution environment and dot destination.
2. Run the smoke task manually if authorized. Inspect its revision-1 marker in the actual output.
   Record the native-provided run/chat link, where the chat appears, where the result/summary
   arrives and which environment actually executed it. Report unavailable fields as unknown.
3. Change only the smoke prompt's marker from `TANAABOT-SYNC-SMOKE-1` to
   `TANAABOT-SYNC-SMOKE-2` in the source revision selected for this test. Synchronize again.
   Confirm the same native ID was updated, other settings were preserved and updatedAt changed.
   Run it manually and inspect revision 2. This is a prompt revision, not a persisted run counter.
4. Change only one shared partial and synchronize all. Confirm both affected tasks update by their
   existing IDs. Rerun unchanged: no updates or duplicates, and timestamps remain unchanged.
   Local tests exercise all three partials; the live pilot needs only one representative change.
5. Separately observe an authorized scheduled occurrence. Manual Run now does not prove unattended
   execution or that its worker can save another schedule. Preserve the supported manual handoff
   if the selected Cloud environment cannot apply schedules.
6. Restore the source and saved tasks to the approved post-test state, keeping smoke paused outside
   the validation window. Use the existing workflow and original native IDs; do not delete unrelated
   schedules or repeat uncertain creates.

For the chat-location investigation, distinguish the execution chat, schedule run history, a result
delivered to the dot and desktop sidebar placement. Check native chat links and summary routing
without claiming that a prompt controls native preview chrome or that a sidebar group is a
scheduler feature. Do not change reusable-chat or grouping behavior until that scope is selected.
