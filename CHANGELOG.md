## {{ UNRELEASED_VERSION }} - [{{ UNRELEASED_DATE }}]({{ UNRELEASED_LINK }})

### Cloud setup

- Added `$tanaabot-record-publication` to record which branch or exact commit the Dot should use for synchronization after Cloud publication. [#46](https://github.com/tanaabased/tanaabot/pull/46)
- Added `$tanaabot-startup-check` to load repository skills and report whether a fresh Cloud chat can use its tools, identity and Canon skills. [#5](https://github.com/tanaabased/tanaabot/issues/5)
- Added support for installing `dev`, `stable`, `edge`, a named branch or tag, or an exact commit with `scripts/cloud-setup.sh`. [#45](https://github.com/tanaabased/tanaabot/pull/45)
- Added Tanaboot to install Cloud tools, configure Git signing and load the agent’s 1Password environment. [#13](https://github.com/tanaabased/tanaabot/pull/13) [#26](https://github.com/tanaabased/tanaabot/pull/26)

### Scheduled tasks

- Added `automation-sync` to synchronize schedules from GitHub and recover archived or deleted worker chats. [#17](https://github.com/tanaabased/tanaabot/pull/17) [#55](https://github.com/tanaabased/tanaabot/pull/55)
- Added `cloud-update` to update the account’s Canon plugin and report startup results in its worker chat. [#33](https://github.com/tanaabased/tanaabot/pull/33) [#48](https://github.com/tanaabased/tanaabot/pull/48)
- Added `instruction-sync` to show proposed changes to the Dot’s saved instructions and apply them after operator approval. [#35](https://github.com/tanaabased/tanaabot/pull/35) [#39](https://github.com/tanaabased/tanaabot/pull/39)
