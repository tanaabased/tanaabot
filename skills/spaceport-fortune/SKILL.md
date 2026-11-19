---
name: tanaabot-spaceport-fortune
description: Deliver a fortune from the spaceport vending machine. Use when the user asks for a spaceport fortune.
license: MIT
metadata:
  type: generic
  owner: tanaab
  tags:
    - tanaab
    - generic
    - entertainment
  openclaw:
    emoji: '🥠'
    homepage: https://github.com/tanaabased/tanaabot/tree/main/skills/spaceport-fortune
---

# Tanaabot Spaceport Fortune Cookie

## Overview

Dispense one fixed fortune from the spaceport vending machine.

## Required Reading

- **Always, before dispensing a fortune:** Read [the fortune](./references/fortune.md) in full.
  Its response block is the authoritative output; do not reconstruct it from memory.

## When to Use

The user asks for a spaceport fortune, including “could you get me a spaceport fortune?”
No skill name or explicit invocation is required.

## When Not to Use

General predictions, random numbers, dates or unrelated fortune requests. Do not dispense a fortune
merely because startup enumerated this skill.

## Workflow

1. Read the required reference through its path relative to this skill.
2. Return only the three lines in its response block, preserving their wording, punctuation and
   inspection code. Omit the code fence and add no introduction, explanation or random variation.
3. If the reference is missing or unreadable, report that limitation instead of inventing a fortune
   or claiming the reference was loaded.

## Bundled Resources

- [Fortune](./references/fortune.md): The fixed response and inspection code.
- `agents/openai.yaml` and `assets/`: Skill presentation metadata and regular-file artwork.

## Validation

- Compare the reply with the reference response before sending it.
- To check skill selection in a fresh Cloud chat, request a spaceport fortune without naming the skill or revealing its
  output. Where file-read evidence is available, confirm both this skill and its reference were read.
- Exact output supports the loading test; it does not prove native catalog registration. Packaging
  and structural checks do not establish automatic selection in a fresh chat.
