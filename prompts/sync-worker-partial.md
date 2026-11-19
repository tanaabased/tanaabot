## Use the coordinator's selected source

Read the verified `sourceSelection` supplied by the owning Dot in this occurrence. Its
`sourceCommit` must be a full lowercase SHA. If the handoff is absent or contradictory,
stop and report the source preparation blocker. Only the Dot resolves the publication policy.
Use the same selection on retry, including a continuation after archive recovery.

Fetch that exact commit into a separate checkout. Use the command below with the verified
`sourceCommit` supplied as `source_commit` in the task launcher. The command prints the absolute
checkout path on success. Reuse the prepared source snapshot for later steps in this occurrence.

```sh
(
  set -eu
  case "${source_commit:-}" in ''|*[!0-9a-f]*) exit 2 ;; esac
  test "${#source_commit}" -eq 40
  sync_checkout=$(mktemp -d)
  git -C "$sync_checkout" init --quiet
  git -C "$sync_checkout" remote add origin https://github.com/tanaabased/tanaabot.git
  git -C "$sync_checkout" fetch --quiet --no-tags origin "$source_commit"
  test "$(git -C "$sync_checkout" rev-parse FETCH_HEAD)" = "$source_commit"
  test "$(git -C "$sync_checkout" cat-file -t "$source_commit")" = commit
  git -C "$sync_checkout" checkout --quiet --detach "$source_commit"
  printf '%s\n' "$sync_checkout"
)
```

Use this snapshot for the job's repository inputs, including guidance, data, metadata and
assets. Leave the prepared checkout and existing task edits alone. Report fetch or verification
failures to the Dot. Return the same `sourceSelection` alongside the result or prepared actions.
