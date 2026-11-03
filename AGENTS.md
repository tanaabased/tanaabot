# tanaabot repository guidance

Keep root guidance broadly applicable to repository work. Put narrower policy beside the files
it governs. Use Me's folder and development conventions as the baseline, adapting them for tanaabot.

## Contributor identity

Contribute using your own trusted runtime identity, credentials and authority. Editing this repository
does not select tanaabot's persona or an account. The designated Cloud assistant loads its
[global guidance](./dotfiles/ai/.codex/AGENTS.md) only through the operator-selected
[bootstrap procedure](./prompts/bootstrap.md).

## Human-facing voice

Use tanaabot's voice for this repository's prose: a courteous, precise protocol droid with
grandmotherly warmth and restrained humor. Lead with the useful answer, use normal sentence
capitalization and keep technical instructions calm and direct. Preserve exact technical casing.

Read and apply [Tanaabot Voice](./skills/voice/SKILL.md) (`$tanaabot-voice`) before drafting or revising
human-facing prose, including documentation and GitHub replies. Use the local file when the skill
is not available through the host. A more specific requested voice takes precedence. This house style
does not change the contributor's identity, account or authority.

## Purpose and boundaries

This repository owns tanaabot's profile and the developing Codex Cloud setup scaffold. Follow Agent
System's manifest syntax and setup metadata formats rather than maintaining a parallel schema.
The choice between a small deterministic installer and Agent System integration remains open.
Shared syntax does not establish runtime support; keep setup declarations independent of that choice.
Cloud provisioning does not own Codex schedules or authorize automation activation.

Keep generic provisioning with Bootbox and shared skill methods with Canon and Agent System.
Use declared setup checks and focused repairs for repeatable setup as they are implemented.
Sign-in, account selection, credentials, live appearance and schedule activation retain their
own runtime controls and explicit operator scope.

## Sources of truth

- `.agent-system/agent.yaml` owns the declared identity and setup references. Use supported Agent
  System fields for future model profiles and automation declarations when those are introduced.
- `.agent-system/setup-host.yaml#steps` and `.agent-system/setup-agent.yaml#steps` own host and
  profile setup declarations, including plugin sources. Check/apply commands are stubs that fail
  explicitly; they do not establish readiness or install anything.
- `tanaboot.sh` is the bootstrap wrapper; `scripts/setup-cloud.sh` owns the Cloud setup entrypoint.
  Keep Bootbox provisioning and Codex Tools installation with those owners. Resolve GitHub refs
  before passing local source paths to Codex Tools; do not duplicate its installer or cache handling.
- `Brewfile` owns the initial CLI dependency inventory. Keep it free of workstation casks.
- `dotfiles/shell`, `dotfiles/git`, `dotfiles/gh` and `dotfiles/ssh` hold inactive configuration stubs.
  Runtime paths, Git identity, signing and authentication must be selected during later setup work.
- `dotfiles/ai/.codex/AGENTS.md` owns the global guidance source, following Me's home-relative
  dotpackage layout. `prompts/` owns explicit source loading and refresh until Cloud setup is implemented.
- `skills/voice/` owns tanaabot's voice for conversation and repository prose.
- `skills/skill-author/` owns tanaabot's customization of Canon Skill Author. Read and apply it before
  creating or maintaining this plugin's skills, using the local file if the host has not loaded it.
- `.codex-plugin/plugin.json` owns the plugin identity and display metadata. Keep its version aligned
  with `package.json`. Use this supported layout while the shared validator and cache tooling require it.
- `package.json#files` selects the npm payload; `codexTools.managedPaths` selects cache-managed files.
  Keep both explicit and exclude private state, development dependencies and `TASKS.md`.
- `assets/` holds compact bot artwork. Keep source artwork in its separately managed archive.
- Shared methods remain with Canon and Agent System. Tanaabot's own voice and skill customizations
  belong here. Use external skills through their owning runtime; do not copy their implementations
  or assume a sibling checkout or installed plugin.
- `MIGRATION.md` records the source revision, path mapping and remaining consumer verification for
  [Me #170](https://github.com/pirog/me/issues/170). No Me source deletion belongs in this repository.
- `TASKS.md` is temporary planning scratch for the scaffold review, not runtime configuration or
  proof that a capability has shipped. Keep it outside future plugin payloads and managed caches.
- `README.md` owns the primary installation, usage and development journey.

## Folder conventions

As the scaffold grows, use `skills/` for tanaabot's skill customizations, `references/` for shared
supporting guidance, and top-level packages under `dotfiles/` for installed user configuration.
Keep root contributor guidance separate from the global guidance installed by the `ai` dotpackage.

Local skills use owner `tanaab`, public namespace `tanaabot` and the `codex-plugin` folder convention:
`skills/voice/` contains `tanaabot-voice`. Pass these values explicitly to Canon's authoring and
validation tools.

Use `scripts/` for internal commands, `lib/` for orchestration, `utils/` for narrow reusable functions,
and `test/` beside the code it verifies. Use `examples/` for executable consumer scenarios.
Keep entrypoints thin; add folders as their reviewed contents arrive. Shared implementations stay
with their existing owners.

## Durable rules

Never commit credentials, private account bindings, Cloud IDs, authenticated runtime state, generated
Codex configuration or applied-state records. Repository edits do not authorize installation, identity
bootstrap, connector changes, live appearance changes or schedule reconciliation. Those require their
own explicit operator scope and supported runtime controls. Preserve shared skills and local pet
compatibility in Me.

- Do not update the live Codex installation, sync plugin caches or run setup repairs as routine
  validation. Use isolated environments for package and setup checks.
- `codex:check` inspects an existing installation; `codex:sync` changes its cache and requires an
  authorized maintenance task. Neither command belongs in ordinary package validation.
- Never overwrite unrelated files or symlinks while installing dotpackages or plugin resources.
- Keep generated distribution output with its build owner; change source inputs during routine work.
- Preserve runtime-owned issue handling and publication controls; do not copy Me's account bindings,
  assignments, schedules or blanket operating permissions into this profile.

## Validation and change discipline

Use the project-declared Bun version and `bun install --frozen-lockfile --ignore-scripts`, then
`bun run lint`. Run the narrowest relevant behavioral checks when executable code is added; do not
add tests that merely freeze prose or folder layouts. Use existing parsers for schema checks.
For text changes, run `git diff --check`. Verify changed manifest paths, local links and image
references; decode changed PNGs and compare migration hashes. Source validation does not prove
Cloud loading or live configuration. Report unavailable checks separately. Do not run Leia locally
or machine-mutating validation unless explicitly requested.

Keep changes bounded and preserve unrelated edits. Use an isolated task branch by default; follow
explicit operator requests about commits and publication. Issue-backed commit subjects use
`#<issue>: <lowercase description>`. Do not push or publish without authority for that action.
