---
name: tanaabot-startup-check
description: Verify a prepared Tanaabot Cloud environment and explicitly load its local skill metadata without changing files or settings. Use as its direct-path Start skill, during onboarding or for a requested startup health check.
license: MIT
metadata:
  type: generic
  owner: tanaab
  tags:
    - tanaab
    - generic
    - environment
  openclaw:
    emoji: '🩺'
    homepage: https://github.com/tanaabased/tanaabot/tree/main/skills/startup-check
---

# Tanaabot Startup Check

## Overview

Check the prepared Tanaabot Cloud environment and installed dotfiles, explicitly load local Tanaabot
skill metadata into this chat, and check Canon's separate catalog availability.
Verification never provisions, upgrades, switches revisions, binds Agent System or activates schedules.

## Required Reading

- **Always:** Read and apply [Tanaboot usage](../../TANABOOT.md#usage) for check behavior and limits.
- **Before reporting:** Read and apply [Tanaabot Voice](../voice/SKILL.md).
- **Before assigning results or composing the card:** Read and apply the
  [startup report contract](./references/startup-report.md).

## When to Use

- Starting a fresh task in a prepared Tanaabot Cloud environment through its Start skill.
- An explicit request to verify an existing Tanaabot Cloud installation.

## When Not to Use

Installation, repair, updates, publishing an environment or proving a safe setup rerun. Those need
separate operator-authorized scope. This skill inspects the saved installation only.

## Workflow

1. Establish the prepared Tanaabot source checkout from the absolute startup path supplied by the
   environment's Start skill, the host's environment context or the resolved target of
   `~/.codex/AGENTS.md`, which agent setup links to
   `dotfiles/ai/.codex/AGENTS.md`. Verify the source belongs to `tanaabased/tanaabot` and record its
   full commit. Do not assume the task's working directory or an optional plugin cache is the prepared
   checkout. If no source can be established, report that check as unverified; do not fetch a replacement.
2. Record the task tool's actual shell and command-launch flags. Run
   `bash <prepared-checkout>/tanaboot.sh --check` through that same launcher, without first sourcing
   shell initialization or changing PATH. The command checks declared tools, fresh shells and readable
   configuration offline, including private environment file safety and equality with the actual
   exported environment. The variable names come from that file, not a fixed checklist. Preserve its
   exit status and safe diagnostics. It does not inspect the container's plugin registry or require
   maintenance permissions.
3. Assign Environment, Dependencies and Dotfiles results using the report contract. For the active
   dotpackages, also verify that Stow destinations link to the expected prepared source files; a
   matching copy alone does not prove correct Stow installation. The installed global `AGENTS.md`
   belongs under Dotfiles. Automatic instruction delivery is outside this pilot's result and remains
   [#16](https://github.com/tanaabased/tanaabot/issues/16); do not add a separate guidance row or warning.
   If the combined command stops early, retain its completed checks and continue independent
   read-only inspection. A check prevented by missing prerequisites is unverified, not another failure.
   The independent environment check is
   `bun --no-env-file <prepared-checkout>/scripts/environment-task.js --check`, through the same unmodified launcher.
   Never print the environment file, values, hashes, tokens or command environment. Do not source the
   loader to turn a failed visibility check into a pass.
4. For **Tanaabot skills**, enumerate `SKILL.md` files beneath the prepared checkout's `skills/`
   directory. Verify each instruction file is readable and has a nonempty body and valid YAML
   frontmatter with nonempty string `name` and `description` fields. Names must be unique within
   this inventory. Retain every name, description and absolute file path, together with the prepared
   revision, in the chat context for subsequent task selection. Do not write an inventory file.
   A missing or empty skills directory, unreadable file, empty instructions or invalid metadata fails
   this section. If the prepared source or enumeration cannot be established, report it as unverified
   rather than passing a partial inventory. Do not hardcode skill names or counts or execute every
   workflow at startup. For every subsequent request, select applicable skills from both this local
   inventory and the host-supplied catalog. Treat local skills as available even when absent from
   the native catalog; do not wait for the user to name or invoke them. When a skill applies, read
   and follow its full instructions and all applicable required references before the relevant work.
   Success means explicit local loading, not native catalog discovery. Do not require Tanaabot
   catalog entries, register skills, fetch a newer revision or require a plugin installation.
5. For **Canon skills**, look for machine names starting with `tanaab-` in the current task's
   catalog, allowing host qualification such as `tanaab:tanaab-skill-author`. Use plugin ownership
   metadata when available to exclude unrelated matches. A nonempty matching catalog establishes
   basic availability only, not ownership from the prefix alone or completeness of a Canon release.
   An accessible catalog with no matches fails this section; unavailable catalog evidence leaves it
   unverified. Canon is delivered through the ChatGPT account independently of this repository.
   Do not inspect the container's plugin registry, require a fixed version or inventory, install,
   update, or query npm during this check.
6. For **Identity**, check effective Git identity, SSH signing settings, public-key trust and SSH
   identity selection against the prepared manifest and dotfiles. Tanaboot checks the private/public
   key match without printing either key. Inspect effective settings with read-only Git and SSH
   configuration commands; do not create a commit, start an agent or attempt SSH access at startup.
   Verify the existing GitHub CLI credential with `gh api --hostname github.com user --jq .login`
   and compare the login with `github.username` in the manifest. A wrong identity or rejected
   credential fails Identity; unavailable network or missing prerequisites leave authentication
   unverified. Keep raw service errors private. Do not log in, register keys, change credentials,
   fall back to another account or inspect connector credentials. Email configuration is identity,
   not proof of Google authentication; connected-account selection remains
   [#11](https://github.com/tanaabased/tanaabot/issues/11).
7. Compose one card using the report contract. Keep successful and not-applicable rows terse; show
   explanatory details only for failed or unverified rows. Retain revision and diagnostic evidence in
   the working context without creating a receipt or printing routine success details. A script
   returns an exit code; this skill reports the overall result in its response. Do not turn missing
   evidence into a pass or expose private configuration and credentials.

## Bundled Resources

- [Tanaboot](../../tanaboot.sh): Shared host and agent readiness checks.
- [Tanaabot Voice](../voice/SKILL.md): Courteous, concise reporting.
- [Startup report contract](./references/startup-report.md): Section criteria, status rules and cards.

## Validation

Confirm that no provisioning or state change was attempted, that all six rows appear in order, and
that only failed or unverified checks carry details. Apply the overall failure/uncertainty rules;
deferred instruction delivery does not prevent a pass. Distinguish machine
checks, explicit local Tanaabot loading and Canon catalog availability. Confirm the retained local
inventory contains each skill's name, description and absolute path. This does not alter the native
catalog. Maintenance validation checks structure and packaged references; a fresh Cloud trial must
establish that the saved Start skill runs without a manual bootstrap prompt and that a later relevant
request selects and reads the appropriate local skill without naming it in the request.
