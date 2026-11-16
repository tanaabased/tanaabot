# Clean-start smoke pilot

The repository declares only enabled `sync` and enabled `smoke-test-canary-3`. Sync runs at
midnight Eastern. Canary #3 is a true one-shot at the published `schedule.at` timestamp.
Source settings do not establish saved native state.

## Cleanup and seed

1. The operator manually removes the old Tanaabot pilot schedules and worker chats, including
   the old synchronizer and smoke canaries. Leave **UPDATE CLOUD CANON** and unrelated tasks
   untouched. Do not delete or archive anything as part of this skill.
2. Inspect the relevant native schedule and chat listings to confirm the clean slate. If an old
   managed item remains, report it for operator cleanup rather than creating a duplicate.
3. Fetch fresh canonical `main` and follow the sync skill with `id: "sync"` for both targets and
   assembly. Use the existing published Tanaabot Cloud environment. Initialize its reusable
   `AUTOMATION SYNC` worker in `REPORTS`, then save the enabled midnight Eastern schedule.
4. Verify the saved enabled state and displayed next run. Inspect the worker's `CHAT CREATED`
   card, separate `AUTOMATION SYNC · CREATED` configuration card and run-results card.
   Stop after seeding; do not run the saved sync task or the canary automatically.

## Publish the pilot time and run

Use the operator-approved absolute `schedule.at` published on `main`. Confirm it is still ahead
before Run now. If the lead time has evaporated, agree with the operator on a replacement about
30 minutes ahead and publish it before proceeding. Never replace it with a rolling relative delay.

1. The operator uses **Run now** once on the saved sync task. It fetches fresh `main`, updates
   itself first if needed, then creates the `SMOKE TEST CANARY #3` worker and one-shot schedule.
2. Verify the saved firing instant and enabled state against the published definition. Do not
   run the canary manually. Inspect its `CHAT CREATED` and separate schedule `CREATED` cards.
3. In the sync worker, verify the configuration card if sync changed, followed by one separate
   `AUTOMATION SYNC · RUN RESULTS` card with a row for each considered automation. In the main
   chat, inspect individual compact summaries without a duplicate aggregate.
4. Test each “Go to chat →” link to the active worker on desktop and iOS where available.
   Report an untested client as unverified; backend access does not prove client navigation.
5. Let the scheduled occurrence run. Check `TANAABOT-SCHEDULE-CANARY-3`, native scheduled-run
   evidence, the observed Cloud environment, worker result and main-chat summary.
6. Run sync again after the firing time. Verify Canary #3 is skipped without rearming, recreating
   its schedule or replacing its worker. A skipped result alone does not prove it executed.

Leave sync enabled. Any later cleanup of chats or schedules belongs to the operator. An unattended
sync creating or updating a schedule remains a separate test; manual sync and a scheduled canary
do not establish it. Preserve the coordinator handoff when the worker lacks scheduling tools and
report prepared actions separately from verified saved changes.
