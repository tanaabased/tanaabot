# tanaabot scaffold checklist

Temporary working list for #4. Me supplies the relevant conventions; tanaabot owns its identity,
voice and setup choices. The source scaffold is complete. Implementation and live validation remain
separate work. Keep this pass uncommitted on local `main`, with no push or installation.

## 1. Repository layout and Agent System metadata

- [x] Adapt root guidance and folder conventions from Me.
- [x] Move the manifest into `.agent-system/agent.yaml` using the shared schema.
- [x] Add host and agent setup declarations with explicit failing check/apply stubs.
- [x] Update loading prompts and paths; retain all six artwork assets.

## 2. Codex plugin scaffold

- [x] Add `.codex-plugin/plugin.json` with tanaabot's identity, branding and skill declarations.
- [x] Align package metadata, runtime declarations, development tools and explicit payload selection.
- [x] Add extracted-package PR validation and an npm publication dry run.
- [x] Establish needed folders without copying shared implementations or adding unused empty trees.

## 3. Guidance, voice and skill authoring

- [x] Move global guidance to `dotfiles/ai/.codex/AGENTS.md`; keep root guidance separate.
- [x] Add Tanaabot Voice and its short defaults, display metadata and samples.
- [x] Add Tanaabot Skill Author using Canon's tools and the `tanaabot` namespace.
- [x] Remove appearance sync and active references; keep its historical migration mapping.

## 4. Bootstrap and setup entrypoints

- [x] Add `tanaboot.sh` and the `scripts/setup-cloud.sh` entrypoint with a read-only preview.
- [x] Wire setup targets into host/agent metadata without reporting unimplemented work as success.
- [x] Declare tanaabot's local source and Canon at `main`; support preview inputs for other local,
      GitHub-ref and npm plugin sources.
- [x] Leave deterministic installation versus Agent System integration undecided. Keep Codex
      automation management separate from Cloud provisioning.

## 5. Packages, dotfiles and Git/SSH setup

- [x] Add an initial CLI-only Brewfile adapted from Me, without workstation casks.
- [x] Add home-relative `shell`, `git`, `gh` and `ssh` configuration stubs beside `ai`.
- [x] Reserve setup targets for PATH, Git identity/signing, GitHub access and SSH authentication.
- [x] Defer inbound authorized keys until needed; include no identities, private keys or account bindings.

## 6. Single-page README and inventory

- [x] Put the truthful preview/setup journey first and distinguish source scaffolding from installation.
- [x] Include skills, dotpackages, dependencies, configuration and automation inventories.
- [x] Update migration mappings and retain Me's consumer-verification cleanup dependency.

## Follow-up implementation and validation

- [ ] Decide the smallest installation mechanism after a bounded Cloud compatibility test; do not
      assume either an Agent System adapter or a new local YAML runner is necessary.
- [ ] Verify Cloud paths, writable state, prerequisite availability, network policy and runtime versions.
- [ ] Implement initial installation and repeatable checks/repairs, including Linux Homebrew PATH
      in fresh tasks and non-login command shells.
- [ ] Resolve GitHub refs once to commits; implement source preparation and plugin installation.
- [ ] Verify global guidance and native skill discovery in a fresh Cloud task.
- [ ] Select runtime Git/GitHub identity and separate SSH authentication, signing and trust inputs.
- [ ] Choose automation execution/state ownership in Codex; keep schedules and installation identities
      out of reusable Cloud snapshots until their lifecycle is defined.
- [ ] Replace the manual bootstrap/refresh prompts once working setup owns their responsibilities.
- [ ] Add release publication only when requested; run hosted CI and installed consumer checks separately.
