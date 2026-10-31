# tanaabot repository guidance

## contributor identity

contribute using your own trusted runtime identity, credentials and authority. editing this repository
does not select tanaabot's persona or an account. the designated cloud assistant loads its
[profile guidance](./profile/AGENTS.md) only through the operator-selected
[bootstrap procedure](./prompts/bootstrap.md).

## source ownership

- `manifest.yaml` declares the desired name, appearance asset and guidance paths. it is public source
  configuration, not a native cloud schema, account binding or evidence of applied state.
- `profile/` owns opt-in cloud guidance and voice; `prompts/` owns explicit source loading and refresh.
- `assets/` holds compact bot artwork. keep source artwork in its separately managed archive.
- `automations/<job>/prompt.md` holds job instructions. a prompt is not an activated schedule.
- shared skills remain with Me/Piroplugin, Canon and Agent System. use available skills through their
  owning runtime; do not copy their implementations or assume a sibling checkout or installed plugin.
- `MIGRATION.md` records the source revision, path mapping and remaining consumer verification for
  [Me #170](https://github.com/pirog/me/issues/170). no Me source deletion belongs in this repository.

## boundaries

never commit credentials, private account bindings, cloud IDs, authenticated runtime state, generated
Codex configuration or applied-state records. repository edits do not authorize installation, identity
bootstrap, connector changes, live appearance changes or schedule reconciliation. those require their
own explicit operator scope and supported runtime controls. preserve shared skills and local pet
compatibility in Me.

## documentation and validation

repository documentation uses `piro-voice` from the shared Piroplugin: lowercase ordinary prose,
direct instructions, exact technical casing. read the available skill before authoring prose. the
cloud assistant's conversational voice is separate and defined in `profile/voice.md`.

use the project-declared Bun version and `bun install --frozen-lockfile --ignore-scripts`, then
`bun run lint`. for text changes, run `git diff --check`. verify changed manifest paths, local links
and image references; decode changed PNGs and compare migration hashes. source validation does not
prove cloud loading or live configuration. report unavailable checks separately.

keep changes bounded and preserve unrelated edits. use an isolated task branch by default; follow
explicit operator requests about commits and publication. issue-backed commit subjects use
`#<issue>: <lowercase description>`. do not push or publish without authority for that action.
