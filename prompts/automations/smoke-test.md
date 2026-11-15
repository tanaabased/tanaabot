# Harmless synchronization smoke test

Perform no external writes or schedule changes. Return a quoted smoke-test result card with
the marker `TANAABOT-SYNC-SMOKE-1`, the automation ID, contentHash and updatedAt actually present
in this task's metadata, and the observed execution environment. Include a native-provided
run/chat link when available. Follow the shared success footer and diagnostic rules.

This demonstrates receipt of the assembled prompt and shared instructions, not successful
scheduling of another task. If expected metadata or environment evidence is missing, return a
warning card describing the gap. Never increment a persistent counter; the pilot changes the
prompt marker from revision 1 to 2 and checks the updated output explicitly.

For the owning dot, use a short summary card headed `## 🧪 SMOKE TEST`, stating the observed marker,
whether the expected environment was verified and whether review is needed. End it with one status
line as directed by the presentation partial; keep status out of the heading. Include the verified run/chat link when
available. Do not repeat the full metadata table in that summary or claim the host delivered it
separately unless native evidence establishes that routing.
