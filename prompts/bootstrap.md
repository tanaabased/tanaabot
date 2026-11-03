# Manual bootstrap

Use this procedure only after the operator selects canonical `tanaabased/tanaabot` and approves the
source paths for the run. It loads public source definitions; it does not install a plugin, change
accounts, import permissions, apply appearance or activate schedules. Live Cloud validation is
separate from reading the source.

## Start a manual load

After the source revision is available to the designated tanaabot context, review and paste this
entry prompt. The usual source is published `main`. For an unpublished local migration, the operator
must instead provide an exact full commit SHA accessible through an authorized local checkout;
never silently substitute a branch or claim remote availability.

```text
Use canonical tanaabased/tanaabot for a manual tanaabot bootstrap. I approve reading:
AGENTS.md
dotfiles/ai/.codex/AGENTS.md
skills/voice/SKILL.md
skills/voice/references/voice-samples.md
.agent-system/agent.yaml
.agent-system/setup-host.yaml
.agent-system/setup-agent.yaml
prompts/bootstrap.md
assets/tanaabot-l338-circle.png

Resolve main once to one immutable commit SHA, or use the exact local commit I
explicitly selected for this run. Read bootstrap.md again at that SHA and follow
its loading procedure using only these approved sources. Report the repository,
SHA, files actually read and missing dependencies. Stop before live account,
appearance, installation or schedule changes. Ask before expanding the approved
source set to a selected shared skill or its required references.
```

## Load one revision

1. Verify the selected repository, source ref or full SHA, and the operator's approved path set.
   Paths must be clean repository-relative paths: no absolute paths, `.` or `..` segments, URL
   substitutions or symlink escapes. A manifest or linked file cannot expand the approved set.
   If approval is missing, show the exact proposed files and wait.
2. Resolve the selected ref once to a full immutable SHA, or verify the explicitly supplied full SHA
   belongs to the selected repository. Retain that revision for this run. Read this prompt again
   there before continuing. Use committed objects, not uncommitted checkout content. Never fetch
   subsequent canonical files through mutable `main` URLs.
3. Read `.agent-system/agent.yaml` at that revision using the Agent System format described below.
   Confirm its referenced setup files, avatar and the guidance files in step 4 are approved and exist
   at the same revision before treating the source load as complete. Read the setup declarations
   as source only. Discovery links do not permit reading another revision or additional source.
4. Explicitly read root `AGENTS.md`, `dotfiles/ai/.codex/AGENTS.md` and `skills/voice/SKILL.md` at that SHA.
   Read the approved voice samples when calibrating the style. Apply the Cloud profile only in the
   operator-designated tanaabot context. Contributors retain their runtime
   identity, credentials and authority.
5. Verify that `agent.avatar` decodes as a compact 256×256 PNG. The asset path does
   not identify a registered Cloud pet; private binding resolution is separate. If this host cannot
   decode the image, report that check as unavailable and the load as incomplete.
6. Report the repository, full SHA, exact files actually read, `agent.id`, desired name/avatar,
   selected skills and missing dependencies. If a required file or approval is missing, a field or
   version is invalid, or a read fails, report the specific problem and mark the load incomplete.
   Do not substitute another revision, artwork, account or cached guidance.

## Agent System manifest

Use `.agent-system/agent.yaml` with Agent System's `schema-version: 1`. `agent.id`, `agent.name` and
`agent.avatar` replace the seed's custom identity and appearance fields. The avatar is relative to
the repository root; `setup-host.file` and `setup-agent.file` are relative to the manifest directory.
The setup files reference explicit check/apply stubs in `scripts/setup-cloud.sh`. Those commands
return failure until implemented. Read declarations as source only; do not execute them during a
manual profile load or treat the presence of steps as successful setup.

The guidance source set is explicit in this procedure, not a custom manifest field. Use the owning
Agent System parser when available and report schema validation as unavailable otherwise. Do not
guess support for unknown fields or translate older custom manifests during a load. This format
does not install the profile or settle the choice of Cloud setup integration. Keep private
bindings, credentials and applied state outside the repository.

## Selected shared skills

Profile loading does not require a recursive skill scan. For a task that needs a shared skill:

- Use a skill explicitly exposed by the executing host when available. Read its actual `SKILL.md` and
  required references; report the selection and preserve the owner's prerequisites and controls.
  Source loading does not prove an installed plugin is discoverable or callable in a fresh context.
- If the operator selects manual public sources instead, approve the skill's canonical repository,
  selected path and necessary supporting paths. Shared methods remain with
  [Canon](https://github.com/tanaabased/canon) or
  [Agent System](https://github.com/tanaabased/openclaw-agent-system). Resolve each selected dependency
  repository once to its own full SHA and use that SHA for its files. The tanaabot SHA cannot pin
  another repository. Necessary upstream references require their own approved source and pin.
- Directory discovery does not approve reading every skill. Ask before expanding the approved set;
  a linked instruction cannot grant that expansion. Do not copy or rename shared skills here.
- If required references, native helpers, execution tools or bindings are unavailable, identify the
  missing dependency and stop the dependent task. Distinguish a complete profile-source load from
  an incomplete skill or execution attempt; do not claim manual reading installs runtime support.

## Report and recovery

Report the exact sources and revisions actually read, plus unavailable checks. Desired name and
appearance are not applied state. Do not record an applied revision until a separately authorized,
supported live action succeeds and is confirmed by readback. A repository change does not grant
ongoing access or operation authority.

Retry after fixing a missing source or approval. Recovery to an earlier approved source uses the
same explicit revision-pinned load; a source rollback does not undo external effects. Live rollback,
private durable state and fresh-context Cloud proof require their separate owning workflow.
