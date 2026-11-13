---
name: tanaabot-startup-check
description: Verify this repository's Tanaabot Cloud environment without changing it. Use during Cloud onboarding, as its Start skill or for a requested startup health check.
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
    homepage: https://github.com/tanaabased/tanaabot/tree/main/.agents/skills/tanaabot-startup-check
---

# Tanaabot Startup Check

## Overview

This repository-only skill checks the saved Cloud installation and this task's actual guidance and
skill discovery. It lives in `.agents/skills/` for repository discovery and is excluded from the
plugin. Verification
never provisions, upgrades, switches revisions, binds Agent System or activates schedules.

## Required Reading

- **Always:** Read and apply [Tanaboot usage](../../../TANABOOT.md#usage) for check behavior and limits.
- **Before reporting:** Read and apply [Tanaabot Voice](../../../skills/voice/SKILL.md).

## When to Use

- Starting a fresh task through the Cloud environment's Start skill.
- An explicit request to verify an existing Tanaabot Cloud installation.

## When Not to Use

Installation, repair, updates, publishing an environment or proving a safe setup rerun. Those need
separate operator-authorized scope. This skill inspects the saved installation only.

## Workflow

1. Locate the existing Tanaabot workspace from the host's repository context, verify its origin is
   `tanaabased/tanaabot`, and report its full commit with `git rev-parse HEAD`. Do not fetch or check out
   a revision. If the workspace is unavailable, report the missing source rather than substituting
   the plugin cache: Tanaboot uses the workspace's installed runtime dependencies.
2. Record the host tool's actual shell and command-launch flags. Run
   `bash <workspace>/tanaboot.sh --codex-plugin canon#main --check` through the same command-launch mode
   used for task work, without first sourcing shell initialization or changing PATH. Reuse its host,
   fresh-shell, guidance and Codex Tools checks and its reported tool paths, installed plugin versions,
   cache paths and retained Canon commit. Do not resolve a newer upstream Canon revision. The check
   downloads the latest hosted Bootbox for its core check; report network or check failure explicitly.
3. Check the task's supplied instructions for automatically loaded global Tanaabot guidance. An
   installed-file comparison proves installation only. If automatic loading cannot be established,
   report it as unverified; manually reading the file does not prove startup loaded it.
4. Inspect the host's available skill catalog for Tanaabot and Canon skills. Confirm that
   the repository skill `tanaabot-startup-check` and installed plugin skills `tanaabot-voice`,
   `tanaabot-skill-author` and `tanaab-skill-author` are discoverable, allowing host-qualified plugin
   names. Open the catalog-provided Voice and Canon Skill Author `SKILL.md` paths to verify access. Do not infer discovery from cache files or
   installed/enabled plugin state, and do not install a missing skill.
5. Report the revisions, tool paths and check result, loaded-guidance evidence, and skill-discovery
   result separately. Mark startup verified only when all are established in this task. On failure,
   retain the successful evidence and name the missing prerequisite or next operator action without
   applying repairs. Keep private configuration and credentials out of the report.

## Bundled Resources

- [Tanaboot](../../../tanaboot.sh): Shared host and agent readiness checks.
- [Tanaabot Voice](../../../skills/voice/SKILL.md): Courteous, concise reporting.

## Validation

Confirm that no provisioning or state change was attempted. Distinguish script checks, installed
plugin state, automatic guidance loading and native skill discovery; report unavailable evidence
plainly. A check in an existing task does not prove startup in a new published-environment task.
