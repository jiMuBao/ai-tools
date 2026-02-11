#!/usr/bin/env node

import * as p from "@clack/prompts";
import pc from "picocolors";
import { join, dirname } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import { runDeploy, parseDeployOptions } from "./deploy-impl.ts";
import * as listCommands from "./list.ts";
import { detectInstalledAgents, agents } from "./agents.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  try {
    const pkgPath = join(__dirname, "..", "package.json");
    const fs = require("fs");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return pkg.version;
  } catch {
    return "1.0.0";
  }
}

const VERSION = getVersion();

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[38;5;102m";
const TEXT = "\x1b[38;5;145m";

const LOGO_LINES = [
  " █████╗  ██╗        ████████╗  ██████╗   ██████╗  ██╗      ███████╗",
  "██╔══██╗ ██║        ╚══██╔══╝ ██╔═══██╗ ██╔═══██╗ ██║      ██╔════╝",
  "███████║ ██║ █████╗    ██║    ██║   ██║ ██║   ██║ ██║      ███████╗",
  "██╔══██║ ██║ ╚════╝    ██║    ██║   ██║ ██║   ██║ ██║      ╚════██║",
  "██║  ██║ ██║           ██║    ╚██████╔╝ ╚██████╔╝ ███████╗ ███████║",
  "╚═╝  ╚═╝ ╚═╝           ╚═╝     ╚═════╝   ╚═════╝  ╚══════╝ ╚══════╝",
];

function showLogo(): void {
  console.log();
  for (const line of LOGO_LINES) {
    console.log(`${TEXT}${line}${RESET}`);
  }
  console.log();
}

function showBanner(): void {
  showLogo();
  console.log(`${BOLD}AI Tools Deployment CLI${RESET} v${VERSION}`);
  console.log();
  console.log(`${DIM}Deploy skills and commands to AI agents${RESET}`);
  console.log();
  console.log(`${TEXT}Commands:${RESET}`);
  console.log(`  ${TEXT}deploy${RESET}    Deploy skills and/or commands`);
  console.log(`  ${TEXT}list${RESET}      List available items`);
  console.log(`  ${TEXT}status${RESET}     Show deployment status`);
  console.log(`  ${TEXT}--help${RESET}     Show help`);
  console.log(`  ${TEXT}--version${RESET}  Show version`);
  console.log();
  console.log(
    `${DIM}Run ${BOLD}ai-tools <command> --help${RESET} for more info`,
  );
  console.log();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showBanner();
    return;
  }

  const command = args[0];
  const restArgs = args.slice(1);

  switch (command) {
    case "deploy":
    case "d": {
      const options = parseDeployOptions(restArgs);
      await runDeploy(options);
      break;
    }
    case "list":
    case "ls": {
      const options = listCommands.parseListOptions(restArgs);
      await listCommands.runList(options);
      break;
    }
    case "status":
    case "s": {
      await listCommands.runStatus();
      break;
    }
    case "--help":
    case "-h":
      showBanner();
      break;
    case "--version":
    case "-v":
      console.log(VERSION);
      break;
    default:
      console.log(`${pc.red("Unknown command:")}${RESET} ${command}`);
      console.log(`${DIM}Run ${BOLD}ai-tools --help${RESET} for usage.`);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error();
  console.error(`${pc.red("Error:")}${RESET}`, error);
  process.exit(1);
});
