---
name: tanaabot-startup-check
description: Verify a prepared Tanaabot Cloud environment without changing it. Use during Cloud onboarding, as its Start skill or for a requested startup health check.
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

Check the prepared Tanaabot Cloud environment, installed dotfiles and this task's skill discovery.
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

1. Locate the prepared Tanaabot source checkout through the host's environment context or the
   resolved target of `~/.codex/AGENTS.md`, which agent setup links to
   `dotfiles/ai/.codex/AGENTS.md`. Verify the source belongs to `tanaabased/tanaabot` and record its
   full commit. Do not assume the task's working directory or this plugin's cache is the prepared
   checkout. If no source can be established, report that check as unverified; do not fetch a replacement.
2. Record the task tool's actual shell and command-launch flags. Run
   `bash <prepared-checkout>/tanaboot.sh --check` through that same launcher, without first sourcing
   shell initialization or changing PATH. The command checks declared tools, fresh shells and readable
   configuration offline. Preserve its exit status and diagnostics. It does not inspect the container's
   plugin registry or require maintenance permissions.
3. Assign Environment, Dependencies and Dotfiles results using the report contract. For the active
   dotpackages, also verify that Stow destinations link to the expected prepared source files; a
   matching copy alone does not prove correct Stow installation. The installed global `AGENTS.md`
   belongs under Dotfiles. Automatic instruction delivery is outside this pilot's result and remains
   [#16](https://github.com/tanaabased/tanaabot/issues/16); do not add a separate guidance row or warning.
   If the combined command stops early, retain its completed checks and continue independent
   read-only inspection. A check prevented by missing prerequisites is unverified, not another failure.
4. Inspect the task host's plugin availability and skill catalog. Use the
   [marketplace](../../.agents/plugins/marketplace.json) for expected plugin identities, then obtain
   each delivered plugin's skill inventory from host metadata or its accessible delivered package.
   Derive expected skill names from that revision's declared skill resources; never maintain a fixed
   list or count, substitute the current repository inventory, or fetch newer upstream sources.
   Compare the expected inventory with the task's actual catalog, allowing host-qualified names and
   using plugin ownership metadata where available. Confirm each discovered skill resource is
   readable and nonempty through its catalog-provided path or supported host reader. Read resources;
   do not execute the skills' workflows.
   Missing required plugins or skills and confirmed unreadable resources fail the section. Missing
   inventory or catalog access leaves completeness unverified. Prefixes such as `tanaab-` and
   `tanaabot-` can locate candidates but cannot establish ownership or completeness alone. An
   installed/enabled plugin or files on disk do not prove task discovery. Do not install or refresh.
5. Mark Identity not applicable for this pilot. Do not request credentials, inspect tokens, test SSH
   access or authenticate to a service. Future identity or 1Password checks need explicit requirements.
6. Compose one card using the report contract. Keep successful and not-applicable rows terse; show
   explanatory details only for failed or unverified rows. Retain revision and diagnostic evidence in
   the working context without creating a receipt or printing routine success details. A script
   returns an exit code; this skill reports the overall result in its response. Do not turn missing
   evidence into a pass or expose private configuration and credentials.

## Bundled Resources

- [Tanaboot](../../tanaboot.sh): Shared host and agent readiness checks.
- [Tanaabot Voice](../voice/SKILL.md): Courteous, concise reporting.
- [Startup report contract](./references/startup-report.md): Section criteria, status rules and cards.

## Validation

Confirm that no provisioning or state change was attempted, that all five rows appear in order, and
that only failed or unverified checks carry details. Apply the overall failure/uncertainty rules;
not-applicable identity and deferred instruction delivery do not prevent a pass. Distinguish machine
checks, plugin availability and actual catalog discovery. A check in an existing task does not prove
startup in a new published-environment task. Maintenance validation checks the skill's structure and
packaged references; a fresh Cloud trial must establish its behavior.
