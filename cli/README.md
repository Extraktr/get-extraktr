# Extraktr CLI

Terminal client for the Extraktr extraction API.

Runs the same extraction engine used in the Extraktr platform, extension and API, returning structured output from raw conversation text.

## Install

    npm install -g extraktr

Verify:

    extraktr --help

## Usage

### From a file

    extraktr extract --file ./thread.txt

### PowerShell

    extraktr extract --file C:\path\to\thread.txt

### From stdin (pipe input)

    Get-Content C:\path\to\thread.txt | extraktr extract --stdin

## Output formats

### Default (text)

    extraktr extract --file ./thread.txt

Outputs:
- summary
- tasks
- decisions
- risks

### JSON

    extraktr extract --file ./thread.txt --format json

### Markdown

    extraktr extract --file ./thread.txt --format markdown

## Write output to file

    extraktr extract --file ./thread.txt --format json --output out.json

## Rules

- Use either --file or --stdin, not both
- --stdin requires piped input
- JSON output is clean stdout (no logs)
- --output writes to file instead of stdout

## Environment variables

Optional:

- EXTRAKTR_BASE_URL (default: https://extraktr.com)
- EXTRAKTR_BEARER (optional auth token)

## Examples

    extraktr extract --file meeting.txt --format json

    Get-Content meeting.txt | extraktr extract --stdin --format markdown

## Notes

- This CLI calls the live Extraktr API
- Rate limits may apply
- Designed for scripting, automation, and CI usage

## Links

- Website: https://extraktr.com
- npm: https://www.npmjs.com/package/extraktr
