#!/usr/bin/env node

/**
 * Extraktr CLI — calls the same POST /api/extract contract as the web app (via the frontend proxy).
 *
 * Auth:
 * - Browser sessions use cookies; the CLI cannot. Anonymous extraction works when the deployment allows it.
 * - Optional EXTRAKTR_BEARER or --bearer <token>: forwarded as Authorization (same JWT shape the backend
 *   accepts from the session bridge). Obtaining that token is not part of this package.
 *
 * Env:
 * - EXTRAKTR_BASE_URL — e.g. https://extraktr.com (default). Request goes to ${EXTRAKTR_BASE_URL}/api/extract
 * - EXTRAKTR_FORMAT — default for --format: text | json | markdown
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_BASE = "https://extraktr.com";

function readPackageVersion() {
  try {
    const pkg = require(path.join(__dirname, "package.json"));
    return typeof pkg.version === "string" && pkg.version.trim() ? pkg.version.trim() : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const CLI_VERSION = readPackageVersion();

function printGlobalHelp() {
  process.stdout.write(`Extraktr CLI ${CLI_VERSION} — terminal client for the Extraktr extraction API.

Usage:
  extraktr extract --file <path> [options]
  extraktr extract --stdin [options]   # pipe conversation text

Commands:
  extract    Run extraction (same contract as POST /api/extract on the frontend)

Global options:
  --help, -h      Show this message
  --version, -v   Show package version

Run: extraktr extract --help   (flags, env vars, input rules)
`);
}

function printExtractHelp() {
  process.stdout.write(`
Usage:
  extraktr extract --file <path> [options]
  extraktr extract --stdin [options]   # pipe conversation text on stdin

Input (exactly one):
  --file <path>     Read conversation text from a file
  --stdin           Read from piped stdin (not a TTY)

Environment:
  EXTRAKTR_BASE_URL   Frontend origin (default: ${DEFAULT_BASE})
  EXTRAKTR_BEARER     Optional Authorization: Bearer <jwt>
  EXTRAKTR_FORMAT     Default --format: text | json | markdown (default: text)

Options:
  --source <type>     Optional source_type: slack|gmail|discord|teams|generic
  --format <fmt>      Output: text | json | markdown
  --output <path>     Write output to file (same format as --format)
  --bearer <token>    Overrides EXTRAKTR_BEARER for this run
  --help, -h          Show this help

Notes:
  Do not combine --file and --stdin. On success, stdout is only the formatted result (text, markdown, or JSON). Errors go to stderr.

Examples:
  extraktr extract --file sample.txt
  Get-Content sample.txt | extraktr extract --stdin
  extraktr extract --file sample.txt --format json
  extraktr extract --file sample.txt --format json --output out.json
`);
}
const VALID_FORMATS = new Set(["text", "json", "markdown"]);

function defaultFormat() {
  const e = process.env.EXTRAKTR_FORMAT?.trim().toLowerCase();
  if (e && VALID_FORMATS.has(e)) return e;
  return "text";
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const out = {
    bearer: process.env.EXTRAKTR_BEARER?.trim() || null,
    source: null,
    file: null,
    stdin: false,
    format: defaultFormat(),
    output: null,
  };
  let i = 0;
  if (args[0] === "extract") {
    i = 1;
  }
  for (; i < args.length; i++) {
    const a = args[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--stdin") out.stdin = true;
    else if (a === "--file" && args[i + 1]) {
      out.file = args[++i];
    } else if (a === "--format" && args[i + 1]) {
      out.format = args[++i].trim().toLowerCase();
    } else if (a === "--output" && args[i + 1]) {
      out.output = args[++i];
    } else if (a === "--bearer" && args[i + 1]) {
      out.bearer = args[++i].trim();
    } else if (a === "--source" && args[i + 1]) {
      out.source = args[++i].trim();
    }
  }
  return out;
}

function extractUrl() {
  const base = (process.env.EXTRAKTR_BASE_URL || DEFAULT_BASE).replace(/\/+$/, "");
  return `${base}/api/extract`;
}

function itemText(x) {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x.text === "string") return x.text;
  return String(x);
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () => {
      try {
        resolve(Buffer.concat(chunks).toString("utf8"));
      } catch (e) {
        reject(e);
      }
    });
    process.stdin.on("error", reject);
  });
}

function renderText(data) {
  const lines = [];
  lines.push("=== SUMMARY ===");
  lines.push(data.summary || "(none)");
  lines.push("");
  lines.push("=== TASKS ===");
  (data.tasks || []).forEach((t) => {
    lines.push(`- ${itemText(t)}`);
  });
  lines.push("");
  lines.push("=== DECISIONS ===");
  (data.decisions || []).forEach((d) => {
    lines.push(`- ${itemText(d)}`);
  });
  lines.push("");
  lines.push("=== RISKS ===");
  (data.risks || []).forEach((r) => {
    lines.push(`- ${itemText(r)}`);
  });
  return lines.join("\n");
}

function renderMarkdown(data) {
  const lines = [];
  lines.push("## Summary", "", (data.summary || "(none)").trim(), "");
  lines.push("## Tasks", "");
  (data.tasks || []).forEach((t) => lines.push(`- ${itemText(t)}`));
  lines.push("", "## Decisions", "");
  (data.decisions || []).forEach((d) => lines.push(`- ${itemText(d)}`));
  lines.push("", "## Risks", "");
  (data.risks || []).forEach((r) => lines.push(`- ${itemText(r)}`));
  return lines.join("\n");
}

function renderOutput(data, format) {
  if (format === "json") {
    return `${JSON.stringify(data, null, 2)}\n`;
  }
  if (format === "markdown") {
    return `${renderMarkdown(data)}\n`;
  }
  return `${renderText(data)}\n`;
}

async function resolveInput(opts) {
  if (opts.file && opts.stdin) {
    return {
      error:
        "Error: use either --file <path> or --stdin, not both.",
    };
  }
  if (opts.file) {
    if (!fs.existsSync(opts.file)) {
      return { error: `Error: File not found: ${opts.file}` };
    }
    return { content: fs.readFileSync(opts.file, "utf-8") };
  }
  if (opts.stdin) {
    if (process.stdin.isTTY) {
      return {
        error:
          "Error: --stdin requires piped input (stdin is a TTY). Example: Get-Content sample.txt | extraktr extract --stdin",
      };
    }
    const content = await readStdin();
    if (content.length === 0) {
      return { error: "Error: stdin was empty; pipe conversation text into stdin." };
    }
    return { content };
  }
  return {
    error:
      "Error: provide input with --file <path> or --stdin (pipe). Pass --help for usage.",
  };
}

async function run() {
  const argv = process.argv.slice(2);

  if (argv.length === 0) {
    printGlobalHelp();
    process.exit(0);
  }

  const first = argv[0];
  if (first === "--version" || first === "-v") {
    process.stdout.write(`${CLI_VERSION}\n`);
    process.exit(0);
  }
  if (first === "--help" || first === "-h") {
    printGlobalHelp();
    process.exit(0);
  }

  if (first !== "extract") {
    console.error(`Error: unknown command "${first}". The only command is: extract`);
    console.error("Run: extraktr --help");
    process.exit(1);
  }

  const opts = parseArgs(process.argv);
  if (opts.help) {
    printExtractHelp();
    process.exit(0);
  }

  if (!VALID_FORMATS.has(opts.format)) {
    console.error(`Error: invalid --format "${opts.format}". Use: text, json, markdown`);
    process.exit(1);
  }

  const input = await resolveInput(opts);
  if (input.error) {
    console.error(input.error);
    process.exit(1);
  }

  const content = input.content;

  const payload = { raw_content: content };
  if (opts.source) payload.source_type = opts.source;

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": `ExtraktrCLI/${CLI_VERSION} (+https://extraktr.com)`,
  };
  if (opts.bearer) {
    headers.Authorization = opts.bearer.startsWith("Bearer ") ? opts.bearer : `Bearer ${opts.bearer}`;
  }

  let res;
  try {
    res = await fetch(extractUrl(), {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Extraction failed (network):", err.message || err);
    process.exit(1);
  }

  const rawText = await res.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg =
      data && typeof data.message === "string"
        ? data.message
        : data && typeof data.detail === "string"
          ? data.detail
          : rawText.slice(0, 500);
    const code = data && data.code ? ` [${data.code}]` : "";
    console.error(`Extraction failed: HTTP ${res.status}${code}`);
    if (msg) console.error(msg);
    if (res.status === 401 || res.status === 403) {
      console.error(
        "Hint: Anonymous access may be blocked or rate-limited; signed-in browser traffic uses a session. Optional bearer JWT: EXTRAKTR_BEARER or --bearer."
      );
    }
    process.exit(1);
  }

  if (!data || typeof data !== "object") {
    console.error("Extraction failed: response was not JSON");
    console.error(rawText.slice(0, 500));
    process.exit(1);
  }

  const outStr = renderOutput(data, opts.format);

  if (opts.output) {
    try {
      fs.writeFileSync(opts.output, outStr, "utf8");
    } catch (e) {
      console.error("Error: could not write --output file:", e.message || e);
      process.exit(1);
    }
  } else {
    process.stdout.write(outStr);
  }
}

run().catch((err) => {
  console.error("Extraction failed:", err.message || err);
  process.exit(1);
});
