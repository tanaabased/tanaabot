---
name: tanaabot-skill-author
description: Tanaabot's skill authoring, validation and optimization using Canon's shared methods. Use when creating or maintaining skills for this profile.
license: MIT
metadata:
  type: meta
  owner: tanaab
  tags:
    - tanaab
    - meta
    - skills
  openclaw:
    emoji: '🛠️'
    homepage: https://github.com/tanaabased/tanaabot/tree/main/skills/skill-author
    requires:
      bins:
        - bun
---

# Tanaabot Skill Author

## Overview

Apply tanaabot's names and presentation to Canon's skill-authoring workflow. Canon owns the
standard, templates, scaffolder and validator; this skill owns the profile's customization.

## Required Reading

Read and apply each applicable document before dependent work. Reuse complete reads already in context.

- **Always:** Locate `tanaab:tanaab-skill-author` in the host's available skill catalog, read its full
  `SKILL.md` and follow its applicable Required Reading. Resolve its policies, templates and scripts
  from that discovered installation. The [upstream source](https://github.com/tanaabased/canon/tree/main/skills/skill-author)
  identifies the dependency; a link or remembered path does not replace the installed instructions.
- **Before writing human-facing prose:** Read and apply [Tanaabot Voice](../voice/SKILL.md), including
  its samples when calibrating the voice.

If Canon is unavailable or lacks custom namespace/container support, report the missing dependency
before changing skills. Do not recreate its tools or silently substitute another authoring contract.

## When to Use

Create, standardize, validate or optimize tanaabot skills and this plugin's skill collection.

## When Not to Use

Ordinary product work, executing a skill's task, or authoring for another project with its own
identity and policy. Follow that project's authoring guidance instead.

## Evaluation Criteria

Preserve tanaabot's public names, voice and artwork while applying Canon's structural contract.
Keep skill ownership (`tanaab`) separate from its public namespace (`tanaabot`).

## Anti-Patterns

- Copying Canon's standards, templates, scaffolding code or validators into this plugin.
- Hardcoding a cache version, home directory or sibling checkout as a dependency.
- Carrying over another profile's identity, voice, artwork or operating permissions.
- Shipping symlinked assets or assuming development dependencies will be installed by the consumer.

## Iteration Loop

Follow Canon's authoring and validation loop with the customization below. Validation-only requests
remain read-only. A structural check does not prove that a future agent will follow the instructions.

## Workflow

1. Load the discovered Canon Skill Author and its applicable policies. Use its create, standardize,
   validate or optimize workflow; keep the shared method with its owner.
2. Pass `--owner tanaab --namespace tanaabot --container codex-plugin` to Canon's scaffolder and
   validator. Use unprefixed skill folders and `tanaabot-` machine names and prompts. For scaffolding,
   also pass `--brand-color '#00ebfd'` and an explicit source homepage under
   `https://github.com/tanaabased/tanaabot/tree/main/skills/`. Choose the type, category, display name,
   emoji and description for the actual skill. Use normal sentence capitalization in prose.
3. Use regular-file copies of the plugin root's `assets/composer-icon.svg` and
   `assets/icon-large.png` in each skill's `assets/` directory. Set `icon_small` to
   `./assets/composer-icon.svg` and `icon_large` to `./assets/icon-large.png`. Keep the circle PNG
   for the profile avatar. Review packed resources when changing assets or package selection.
4. Run Canon's validator from the discovered installation with the same explicit owner, namespace
   and container. Review warnings and manual checks, then run the target repository's applicable
   checks. Respect the operator's commit, publication and installation boundaries.

## Optimization

- **Inspect:** Read this customization and the affected skills' identities, voice references,
  display metadata and bundled assets alongside the installed Canon owner.
- **Compare:** Check namespace/container support, required-reading coverage and local policy against
  Canon. Identify copied methods, incorrect profile branding, broken resources and overlapping skill scope.
- **Recommend:** Preserve aligned customizations; reconcile conflicts and remove duplicated methods
  rather than maintaining a local fork. Keep the review read-only until changes are authorized.
- **Apply:** Make the authorized corrections in the smallest owning surface and update affected
  names, links, prompts and package entries together.
- **Verify:** Run Canon's validator for changed skills and check affected packed resources. Report
  structural checks separately from native discovery and instruction-following trials.

## Bundled Resources

- `agents/openai.yaml`, `assets/composer-icon.svg` and `assets/icon-large.png`: Tanaabot discovery and presentation.
- [Tanaabot Voice](../voice/SKILL.md): Human-facing expression.

## Validation

Run the shared validator for each changed skill with the explicit tanaab owner, tanaabot namespace
and plugin container. Review scope, reading triggers, names, prompts, homepages and icon resolution.
Confirm the extracted package retains the resources without checkout dependencies or symlinks.
Report missing Canon tools and unrun native or instruction-following trials plainly; do not treat
package validation as installation or behavioral proof.
