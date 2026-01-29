import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { ListOptions } from './types.ts';
import { discoverSkills } from './skills/index.ts';
import { discoverCommands } from './commands/index.ts';
import { detectInstalledAgents, agents } from './agents.ts';
import { getProjectRoot } from './utils.ts';
import { loadLock } from './lock.ts';

const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const DIM = '\x1b[38;5;102m';

export interface ListOptions {
  type?: 'skills' | 'commands' | 'all';
  installed?: boolean;
}

export function parseListOptions(args: string[]): ListOptions {
  const options: ListOptions = {
    type: 'all',
    installed: false,
  };

  for (const arg of args) {
    if (arg === '--skills' || arg === '-s') {
      options.type = 'skills';
    } else if (arg === '--commands' || arg === '-c') {
      options.type = 'commands';
    } else if (arg === '--installed' || arg === '-i') {
      options.installed = true;
    }
  }

  return options;
}

export async function runList(options: ListOptions): Promise<void> {
  p.intro(pc.cyan('AI Tools List'));

  const skills = await discoverSkills();
  const commands = await discoverCommands();
  const installedAgents = await detectInstalledAgents();

  if (options.type === 'all' || options.type === 'skills') {
    console.log();
    console.log(`${BOLD}Skills${RESET}`);
    console.log(`${DIM}─${RESET}`.repeat(40));

    if (skills.length === 0) {
      console.log(`${DIM}No skills found in ${getProjectRoot()}/skills${RESET}`);
    } else {
      for (const skill of skills) {
        console.log(`  ${pc.cyan('●')} ${skill.name}`);
        if (skill.description) {
          console.log(`    ${DIM}${skill.description}${RESET}`);
        }
      }
    }
  }

  if (options.type === 'all' || options.type === 'commands') {
    console.log();
    console.log(`${BOLD}Commands${RESET}`);
    console.log(`${DIM}─${RESET}`.repeat(40));

    if (commands.length === 0) {
      console.log(`${DIM}No commands found in ${getProjectRoot()}/commands${RESET}`);
    } else {
      for (const command of commands) {
        const name = command.namespace ? `${command.namespace}:${command.name}` : command.name;
        console.log(`  ${pc.cyan('●')} ${name}`);
        if (command.description) {
          console.log(`    ${DIM}${command.description}${RESET}`);
        }
      }
    }
  }

  if (options.installed) {
    console.log();
    console.log(`${BOLD}Installed Agents${RESET}`);
    console.log(`${DIM}─${RESET}`.repeat(40));

    if (installedAgents.length === 0) {
      console.log(`${DIM}No agents detected${RESET}`);
    } else {
      for (const agentType of installedAgents) {
        const agent = agents[agentType];
        console.log(`  ${pc.green('✓')} ${agent.displayName}`);
        console.log(`    ${DIM}${agent.globalSkillsDir}${RESET}`);
      }
    }
  }

  p.outro(`Found ${skills.length} skills, ${commands.length} commands, ${installedAgents.length} agents`);
}

export async function runStatus(): Promise<void> {
  p.intro(pc.cyan('AI Tools Status'));

  const skills = await discoverSkills();
  const commands = await discoverCommands();
  const installedAgents = await detectInstalledAgents();
  const lock = await loadLock();

  console.log();
  console.log(`${BOLD}Last Deployment${RESET}`);
  console.log(`${DIM}─${RESET}`.repeat(40));

  if (lock.lastDeployedAt) {
    const date = new Date(lock.lastDeployedAt);
    console.log(`  ${DIM}Time:${RESET} ${date.toLocaleString()}`);
  } else {
    console.log(`  ${DIM}No previous deployment recorded${RESET}`);
  }

  if (lock.lastSelectedAgents.length > 0) {
    const agentNames = lock.lastSelectedAgents
      .map((a: string) => agents[a as keyof typeof agents]?.displayName || a)
      .join(', ');
    console.log(`  ${DIM}Agents:${RESET} ${agentNames}`);
  }

  if (lock.lastSelectedSkills.length > 0) {
    console.log(`  ${DIM}Skills:${RESET} ${lock.lastSelectedSkills.join(', ')}`);
  }

  if (lock.lastSelectedCommands.length > 0) {
    console.log(`  ${DIM}Commands:${RESET} ${lock.lastSelectedCommands.join(', ')}`);
  }

  console.log();
  console.log(`${BOLD}Available Items${RESET}`);
  console.log(`${DIM}─${RESET}`.repeat(40));
  console.log(`  ${pc.cyan('Skills:')}${RESET} ${skills.length}`);
  console.log(`  ${pc.cyan('Commands:')}${RESET} ${commands.length}`);
  console.log(`  ${pc.cyan('Agents:')}${RESET} ${installedAgents.length}`);

  p.outro('Run `ai-tools list` for more details');
}
