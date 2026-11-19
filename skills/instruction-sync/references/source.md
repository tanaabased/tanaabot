# Instruction sources

## Resolve the desired source

Use the [shared sync source procedure](../../../prompts/sync-source.md) for the canonical
`tanaabased/tanaabot` policy. The scheduled worker resolves it for the owning Dot. Direct sync
resolves it in the main Dot. Use `sourceCommit` for the complete source inventory and the
scheduled skill and its required resources.

1. Read the complete, nonblank `dotfiles/ai/.codex/AGENTS.md` file.
2. Inspect the commit tree for `instructions/` and list all its immediate children. A complete
   parent tree can establish that the directory is absent. A failed lookup, partial or truncated
   listing, or non-directory at that path cannot establish absence. Complete any required
   pagination before selecting files.
3. Read every top-level `instructions/*.md` file completely in ascending, case-sensitive path
   order. Follow the commit's tree entries or read by path at the full SHA. Ignore subdirectories
   and entries with other extensions. Block on symlinks or other non-regular entries selected
   by the file pattern. A previously saved file absent from the complete listing is removed.
   A listed file whose contents cannot be read blocks the entire proposal. Preserve file text
   and line breaks.

The resulting inventory contains the full commit and ordered source paths. Include immutable
GitHub links using that commit when presenting the inventory. An incomplete read or inventory
blocks assembly even if all other files are available. Ignore working-tree edits and mutable
branch reads. Use the fixed source set without file or directory arguments.

## Saved provenance

The full replacement starts with this metadata line, followed by one block per source in the
same order as the inventory. The path identifies a file's role. The global file contains
cross-cutting defaults and each topic file contains standing guidance for its topic.

```text
<!-- TANAABOT SAVED INSTRUCTIONS: tanaabased/tanaabot@<full commit> -->

<!-- BEGIN TANAABOT SOURCE: <path> -->
<complete file text>
<!-- END TANAABOT SOURCE: <path> -->
```

Use one blank line between blocks and a final newline. After the opener's newline, insert the
file text verbatim, then add one framing newline before the closer, even if the file already ends
with one. This lets readers recover the original file text. Reserve these marker prefixes and the
old repository-managed markers below. A source containing any reserved marker blocks assembly.

For a legacy import, one correctly ordered pair of standalone
`<!-- BEGIN TANAABOT REPOSITORY-MANAGED GUIDANCE -->` and
`<!-- END TANAABOT REPOSITORY-MANAGED GUIDANCE -->` lines may enclose the original global-file
import. Check its `Source repository`, `Source path` and `Source commit` fields against the
canonical repository, global path and full commit. The legacy payload begins after the metadata
and blank line and ends before the closing marker. Its framing added a newline only if the source
lacked one.

For reporting, read source files only at the saved import's commit when checking attribution.
Verify path and text against the pinned file before showing a source link as verified. If a
block contains manual edits, identify the verified content and label unattributed text
**Source unknown**. If boundaries or metadata are missing, duplicated or malformed, state the
limit and label affected text **Source unknown**. Never use the current `main` to attribute
saved text. Treat metadata in the saved document as a claim to verify.
