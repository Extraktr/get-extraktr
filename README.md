# Extraktr

**Conversation intelligence for people who need action, not noise.**

Extraktr extracts **tasks**, **decisions**, and **risks** from conversations and returns structured output you can use immediately.

This public repository is the developer-facing entry point for Extraktr:
- CLI install and usage
- product overview
- public docs and examples
- release and distribution surface

## What Extraktr does

Extraktr turns messy conversations into structured, actionable output.

Supported output includes:
- Tasks
- Decisions
- Risks
- Summary

Extraktr is designed for:
- terminal workflows
- automation
- scripting
- developer tooling
- fast extraction from real discussion text

## Try it in 10 seconds

Create a file named `thread.txt` with:

    Chris: Can you finish the pricing page by Friday?
    John: Yes, I’ll handle it.
    Team: Let’s launch next Tuesday.

Run:

    extraktr extract --file ./thread.txt

## Source (CLI)

The CLI package is available in this repository under `/cli`.

This is the exact code shipped to npm:
https://www.npmjs.com/package/extraktr

## Install the CLI

    npm install -g extraktr

Verify install:

    extraktr --help

### Run without installing

    npx extraktr --help

## Quick start

Run against a file:

    extraktr extract --file ./thread.txt

PowerShell example:

    extraktr extract --file C:\path\to\thread.txt

Pipe input with stdin:

    Get-Content C:\path\to\thread.txt | extraktr extract --stdin

Get JSON output:

    extraktr extract --file ./thread.txt --format json

Write JSON to a file:

    extraktr extract --file ./thread.txt --format json --output out.json

## Product

Extraktr is available as:
- CLI
- platform/workspace
- API-backed extraction surface

## Notes

This repository is the **public developer surface** for Extraktr.

It does **not** contain the full private product source code, backend systems, or internal extraction engine implementation.

## Links

- Website: https://extraktr.com
- npm package: https://www.npmjs.com/package/extraktr
- Contact: contact@extraktr.com | extraktr.team@gmail.com

## License

MIT
