# manual bootstrap

use this procedure only after the operator selects canonical `tanaabased/tanaabot` and approves the
source paths for the run. it loads public source definitions; it does not install a plugin, change
accounts, import permissions, apply appearance or activate schedules. live cloud validation is
separate from reading the source.

## start a manual load

after the source revision is available to the designated tanaabot context, review and paste this
entry prompt. the usual source is published `main`. for an unpublished local migration, the operator
must instead provide an exact full commit SHA accessible through an authorized local checkout;
never silently substitute a branch or claim remote availability.

```text
use canonical tanaabased/tanaabot for a manual tanaabot bootstrap. i approve reading:
AGENTS.md
profile/AGENTS.md
profile/voice.md
manifest.yaml
prompts/bootstrap.md
assets/tanaabot-l338-circle.png

resolve main once to one immutable commit SHA, or use the exact local commit i
explicitly selected for this run. read bootstrap.md again at that SHA and follow
its loading procedure using only these approved sources. report the repository,
SHA, files actually read and missing dependencies. stop before live account,
appearance, installation or schedule changes. ask before expanding the approved
source set to a selected shared skill or its required references.
```

## load one revision

1. verify the selected repository, source ref or full SHA, and the operator's approved path set.
   paths must be clean repository-relative paths: no absolute paths, `.` or `..` segments, URL
   substitutions or symlink escapes. a manifest or linked file cannot expand the approved set.
   if approval is missing, show the exact proposed files and wait.
2. resolve the selected ref once to a full immutable SHA, or verify the explicitly supplied full SHA
   belongs to the selected repository. retain that revision for this run. read this prompt again
   there before continuing. use committed objects, not uncommitted checkout content. never fetch
   subsequent canonical files through mutable `main` URLs.
3. read the manifest at that revision and validate the version 2 shape below. confirm every guidance
   and appearance path is approved and exists at the same revision before treating the source load
   as complete. discovery links do not permit reading another revision or additional source.
4. explicitly read root `AGENTS.md`, `profile/AGENTS.md` and `profile/voice.md` at that SHA. apply the
   cloud profile only in the operator-designated tanaabot context. contributors retain their runtime
   identity, credentials and authority.
5. verify that the appearance asset decodes as a compact 256×256 PNG. its logical appearance key does
   not identify a registered cloud pet; private binding resolution is separate. if this host cannot
   decode the image, report that check as unavailable and the load as incomplete.
6. report the repository, full SHA, exact files actually read, desired name/logical appearance,
   selected skills and missing dependencies. a missing file, unapproved path, unsupported version,
   malformed field, unavailable read or revision mismatch makes the source load incomplete. report
   the concrete problem; do not fall back to another revision, artwork, account or cached guidance.

## manifest version 2

this is a repository-owned profile format, not a native ChatGPT configuration schema. accept only
these fields; reject unknown fields until a reviewed schema change defines them:

| field              | requirement                                                                         |
| ------------------ | ----------------------------------------------------------------------------------- |
| `schema_version`   | integer `2`; independent of a release-channel selector                              |
| `display_name`     | nonempty string; desired name, not an identity credential                           |
| `appearance.key`   | nonempty logical string; private binding and live apply are separate                |
| `appearance.asset` | approved relative path to an existing 256×256 PNG                                   |
| `guidance`         | unique list containing exactly `AGENTS.md`, `profile/AGENTS.md`, `profile/voice.md` |

`appearance` contains exactly `key` and `asset`. version 2 replaces Me's version 1 paths and removes
`skills_dir`: shared skills are external dependencies, not a nonexistent local bundle. do not load
version 1 with guessed replacement paths. use its original source or select this migrated profile
explicitly. keep cloud IDs, private bindings, credentials, applied state and schedules out of the
manifest. release-channel selection is deferred.

## selected shared skills

profile loading does not require a recursive skill scan. for a task that needs a shared skill:

- use a skill explicitly exposed by the executing host when available. read its actual `SKILL.md` and
  required references; report the selection and preserve the owner's prerequisites and controls.
  source loading does not prove an installed plugin is discoverable or callable in a fresh context.
- if the operator selects manual public sources instead, approve the skill's canonical repository,
  selected path and necessary supporting paths. for example, `piro-*` sources remain in
  [Me's `skills/`](https://github.com/pirog/me/tree/main/skills); generic methods remain with
  [Canon](https://github.com/tanaabased/canon) or
  [Agent System](https://github.com/tanaabased/openclaw-agent-system). resolve each selected dependency
  repository once to its own full SHA and use that SHA for its files. the tanaabot SHA cannot pin Me
  or another repository. necessary upstream references require their own approved source and pin.
- directory discovery does not approve reading every skill. ask before expanding the approved set;
  a linked instruction cannot grant that expansion. do not copy or rename shared skills here.
- if required references, native helpers, execution tools or bindings are unavailable, identify the
  missing dependency and stop the dependent task. distinguish a complete profile-source load from
  an incomplete skill or execution attempt; do not claim manual reading installs runtime support.

## report and recovery

report the exact sources and revisions actually read, plus unavailable checks. desired name and
appearance are not applied state. do not record an applied revision until a separately authorized,
supported live action succeeds and is confirmed by readback. a repository change does not grant
ongoing access or operation authority.

retry after fixing a missing source or approval. recovery to an earlier approved source uses the
same explicit revision-pinned load; a source rollback does not undo external effects. live rollback,
private durable state and fresh-context cloud proof require their separate owning workflow.
