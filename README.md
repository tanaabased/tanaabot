# tanaabot

<p align="center">
  <img src="./assets/tanaabot-l338-circle.png" alt="tanaabot" width="180" />
</p>

tanaabot's source home: cloud assistant guidance, voice, compact artwork and job prompts,
derived from [Me](https://github.com/pirog/me). this repository defines the profile; it does not
install it, select an account or activate schedules.

## load the profile

follow [manual bootstrap](./prompts/bootstrap.md#start-a-manual-load) in the operator-designated
tanaabot context. select this repository and the approved source paths, resolve one immutable
revision, then report the files actually loaded and any missing dependencies. until the migration
is published, select its exact committed revision from an authorized local checkout; do not claim
these files are available on remote `main`.

[refresh](./prompts/refresh.md) repeats that explicit load. a checkout, previous chat or profile name
does not prove the instructions were loaded or the right account is connected.

[manifest.yaml](./manifest.yaml) declares the desired display name, selected L3-38 appearance and
guidance paths. [profile/AGENTS.md](./profile/AGENTS.md) defines the cloud boundaries and
[profile/voice.md](./profile/voice.md) defines tanaabot's conversational style. contributors retain
their own identity; repository documentation uses the shared `piro-voice` house style.

## shared skills

use skills explicitly available through the executing host, preserving their prerequisites and
runtime controls. shared methods stay with [Canon](https://github.com/tanaabased/canon) and
[Agent System](https://github.com/tanaabased/openclaw-agent-system); personal `piro-*` skills stay
with [Me/Piroplugin](https://github.com/pirog/me/tree/main/skills). there is no local `skills/` bundle
or automatic discovery/install claim here.

for a manual source load, bootstrap describes how to pin and approve a selected shared skill's own
repository separately. listing a directory does not load its skills. a required unavailable skill,
helper or reference makes the dependent task incomplete.

## job prompts

each job keeps its instructions in `automations/<job>/prompt.md`, used for both manual and any later
separately authorized scheduled runs. [appearance sync](./automations/appearance-sync/prompt.md)
defines a manual preview. supported live apply, private bindings, durable state, no-op/rollback proof
and schedule activation remain separate work. no schedule definition is shipped in this seed.

the retired [Me pilot #131](https://github.com/pirog/me/issues/131) is historical context, not current
cloud proof. reading this repo does not activate the previously proposed ideas, blocked-issue or
stale-issue reviews either.

## artwork

the L3-38 spaceport circle is selected in the manifest. all six compact images are 256×256 PNGs;
the circular variants have transparent corners. alternatives remain available without changing the
selected live profile.

| set                  | square                                                                                     | circle                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| realistic            | <img src="./assets/tanaabot.png" width="128" alt="realistic tanaabot square" />            | <img src="./assets/tanaabot-circle.png" width="128" alt="realistic tanaabot circle" />            |
| L3-37 pixel          | <img src="./assets/tanaabot-pixel.png" width="128" alt="L3-37 pixel tanaabot square" />    | <img src="./assets/tanaabot-pixel-circle.png" width="128" alt="L3-37 pixel tanaabot circle" />    |
| selected L3-38 pixel | <img src="./assets/tanaabot-l338.png" width="128" alt="L3-38 spaceport tanaabot square" /> | <img src="./assets/tanaabot-l338-circle.png" width="128" alt="L3-38 spaceport tanaabot circle" /> |

these assets do not install a pet. existing L3-37/L3-38 local pets, human profile artwork and plugin
branding retain their homes in Me. source artwork stays in its separately managed archive.

## development

use the Bun version declared in `.bun-version` and `package.json`:

```sh
bun install --frozen-lockfile --ignore-scripts
bun run lint
git diff --check
```

this seed has formatting validation and a read-only PR lint workflow. it has no application build,
machine bootstrap, self-installer, release publisher or runtime test suite. check source paths and
assets when changing the profile; a formatting pass does not establish a successful cloud load.

## migration and license

[MIGRATION.md](./MIGRATION.md) records the Me revision, retained scaffold, replacement paths and
consumer verification still needed before [Me #170](https://github.com/pirog/me/issues/170) can
remove obsolete sources. nothing is deleted from Me by this migration.

derived sources retain the [MIT license](./LICENSE), including the original Lando Alliance copyright.
report problems through [repository issues](https://github.com/tanaabased/tanaabot/issues).
