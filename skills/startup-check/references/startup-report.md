# Startup report

Return one quoted Markdown card with these six rows, in this order. Use normal sentence
capitalization. Successful and not-applicable rows contain only the section name and status.
Keep the evidence in working context; include details only for failed or unverified checks, unless
the operator explicitly requests diagnostic evidence.

## Sections

| Section         | Required evidence                                                                                                                                                                                                                                                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Environment     | Prepared Tanaabot checkout, canonical origin and source revision identified; supported Linux environment and actual task command launcher established. Required environment variables and 1Password integration may be added later; they are not pilot requirements.                                                                                |
| Dependencies    | Brewfile executables discoverable on the task's effective PATH, usable version output, and declared Node/Bun major versions satisfied. Homebrew maintenance permissions are not required.                                                                                                                                                           |
| Dotfiles        | Active dotpackages installed at their intended home-relative destinations, Stow links resolve to the prepared sources, files are readable and match those sources, and shell initialization actually supplies the tools. Include the `ai` guidance file here; exclude inactive Git, GitHub and SSH stubs.                                           |
| Tanaabot skills | All local `SKILL.md` files beneath the prepared checkout's `skills/` are readable, have nonempty instructions and valid frontmatter with unique names and nonempty descriptions. Their names, descriptions and absolute paths are retained in chat context. This is explicit local loading; native catalog registration is not required or implied. |
| Canon skills    | The task catalog contains machine names starting with `tanaab-`, allowing host qualification. Use ownership metadata when available to exclude unrelated matches. This establishes basic availability, not a complete release inventory or ownership from names alone. Installation and updates belong to the ChatGPT account.                      |
| Identity        | Not applicable for this pilot. SSH keys, GitHub authentication and other identity requirements are deferred; do not probe them.                                                                                                                                                                                                                     |

Automatic global-instruction delivery is separate post-pilot work. Neither its absence nor the
absence of deferred identity or 1Password configuration creates a startup warning.

A passed Tanaabot skills row establishes local loading in this chat. It does not prove that the
environment automatically ran its saved Start skill or that a later request selected the right
local skill; verify those behaviors in the fresh pilot.

## Status rules

- **passed:** All required evidence for the section is established.
- **failed:** A required condition is demonstrably unmet. Preserve other completed checks.
- **unverified:** Evidence is unavailable, incomplete, or the check could not run. Do not infer
  failure from an inaccessible catalog, or success from a partial inventory.
- **not applicable:** The section has no requirements in the current scope. Do not use this to
  excuse a missing required check.

Any failed required check makes the overall result **❌ Startup check failed**. Otherwise, any
unverified required check makes it **⚠️ Startup check incomplete**. Otherwise use
**✅ Startup check passed**. A section with both failure and uncertainty is failed; mention the
unverified remainder briefly when it affects recovery. A script exit code is evidence for the
operation it ran, not an exit code returned by the skill or proof of unrelated sections.

For a failed or incomplete card, describe the specific missing condition in its row and give one
concise **Next step** for the affected checks. Add **Technical detail** only when a safe error code,
path or command materially helps recovery. Never include tokens, secret values or credential dumps.
Do not append raw logs, a second summary, separate diagnostic cards, or routine successful revisions
and tool paths. Do not repair anything during verification.

## Examples

These illustrate formatting; they are not observed results. Replace failure details and next steps
with actual evidence. Preserve the quoted H2 heading and blank quoted line before the rows.

### Passed

> ## ✅ Startup check passed
>
> - **Environment — passed**
> - **Dependencies — passed**
> - **Dotfiles — passed**
> - **Tanaabot skills — passed**
> - **Canon skills — passed**
> - **Identity — not applicable**

### Incomplete

> ## ⚠️ Startup check incomplete
>
> - **Environment — passed**
> - **Dependencies — passed**
> - **Dotfiles — passed**
> - **Tanaabot skills — passed**
> - **Canon skills — unverified:** This task's catalog does not expose the evidence needed to check Canon availability.
> - **Identity — not applicable**
>
> **Next step:** Inspect Canon availability in a fresh task with access to its supplied skill catalog.

### Failed

> ## ❌ Startup check failed
>
> - **Environment — passed**
> - **Dependencies — failed:** `gh`, declared in the Brewfile, is missing from the task's PATH.
> - **Dotfiles — passed**
> - **Tanaabot skills — passed**
> - **Canon skills — passed**
> - **Identity — not applicable**
>
> **Next step:** Repair the dependency during environment setup, then rerun verification.
>
> **Technical detail:** The dependency check returned exit code `1`. No repair was attempted.
