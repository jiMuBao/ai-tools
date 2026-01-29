import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { DeployOptions, DeployPlan, Skill, Command, AgentType } from './types.ts';
import { discoverSkills } from './skills/index.ts';
import { deploySkill } from './skills/installer.ts';
import { discoverCommands } from './commands/index.ts';
import { deployCommand } from './commands/installer.ts';
import { detectInstalledAgents, agents } from './agents.ts';
import { getLastSelectedAgents, getLastSelectedSkills, getLastSelectedCommands, saveSelectedAgents, saveSelectedSkills, saveSelectedCommands, updateDeployTimestamp } from './lock.ts';

export function parseDeployOptions(args: string[]): DeployOptions {
  const options: DeployOptions = {
    global: true,
    agents: [],
    skills: [],
    commands: [],
    yes: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--global') {
      options.global = true;
    } else if (arg === '--local') {
      options.global = false;
    } else if (arg === '--all') {
      options.skills = ['*'];
      options.commands = ['*'];
    } else if (arg === '--yes' || arg === '-y') {
      options.yes = true;
    } else if (arg === '--agent') {
      options.agents = (args[++i] || '').split(',').map(a => a.trim());
    } else if (arg === '--skill') {
      options.skills = (args[++i] || '').split(',').map(s => s.trim());
    } else if (arg === '--command') {
      options.commands = (args[++i] || '').split(',').map(c => c.trim());
    }
  }

  return options;
}

function multiselect<Value>(opts: {
  message: string;
  options: Array<{ value: Value; label: string; hint?: string }>;
  initialValues?: Value[];
}) {
  return p.multiselect({
    ...opts,
    options: opts.options as p.Option<Value>[],
    message: `${opts.message} ${pc.dim('(space to toggle)')}`,
  }) as Promise<Value[] | symbol>;
}

export async function runDeploy(options: DeployOptions): Promise<void> {
  p.intro(pc.cyan('AI Tools Deploy'));

  const availableAgents = await detectInstalledAgents();

  if (availableAgents.length === 0) {
    p.note('No AI agents detected. Install at least one agent (Claude, Cursor, Gemini, etc.) to continue.');
    p.outro('No agents found');
    process.exit(0);
  }

  const availableSkills = await discoverSkills();
  const availableCommands = await discoverCommands();

  let plan: DeployPlan;

  if (options.agents.length === 0 && !options.yes) {
    plan = await runInteractiveWizard(availableAgents, availableSkills, availableCommands);
  } else {
    plan = await runBatchMode(options, availableAgents, availableSkills, availableCommands);
  }

  await executeDeployment(plan);

  p.outro(`${pc.green('✓')} Deployment complete`);
}

async function runInteractiveWizard(
  availableAgents: AgentType[],
  availableSkills: Skill[],
  availableCommands: Command[]
): Promise<DeployPlan> {
  const lastAgents = await getLastSelectedAgents();
  const lastSkills = await getLastSelectedSkills();
  const lastCommands = await getLastSelectedCommands();

  const deployType = await p.select({
    message: 'What would you like to deploy?',
    options: [
      { value: 'both', label: 'Both skills and commands' },
      { value: 'skills', label: 'Skills only' },
      { value: 'commands', label: 'Commands only' },
    ],
  });

  if (p.isCancel(deployType)) {
    process.exit(1);
  }

  let selectedAgents: AgentType[];

  const hasPrevious = lastAgents.length > 0 && lastAgents.every(a => availableAgents.includes(a as AgentType));

  if (hasPrevious) {
    const agentNames = lastAgents.map(a => agents[a as AgentType].displayName).join(', ');

    const choice = await p.select({
      message: 'Install to',
      options: [
        { value: 'previous', label: 'Same as last time (Recommended)', hint: agentNames },
        { value: 'all', label: 'All detected agents', hint: `Install to all ${availableAgents.length} detected agents` },
        { value: 'select', label: 'Select specific agents' },
      ],
    });

    if (p.isCancel(choice)) {
      process.exit(1);
    }

    if (choice === 'previous') {
      selectedAgents = lastAgents as AgentType[];
    } else if (choice === 'all') {
      selectedAgents = availableAgents;
    } else {
      const agentChoices = availableAgents.map((a) => ({
        value: a,
        label: agents[a].displayName,
        hint: agents[a].globalSkillsDir,
      }));

      const selected = await multiselect({
        message: 'Select agents',
        options: agentChoices,
        initialValues: lastAgents as AgentType[],
      });

      if (p.isCancel(selected)) {
        process.exit(1);
      }

      selectedAgents = selected as AgentType[];
    }
  } else {
    const agentChoices = availableAgents.map((a) => ({
      value: a,
      label: agents[a].displayName,
      hint: agents[a].globalSkillsDir,
    }));

    const selected = await multiselect({
      message: 'Select agents',
      options: agentChoices,
      initialValues: [],
    });

    if (p.isCancel(selected)) {
      process.exit(1);
    }

    selectedAgents = selected as AgentType[];
  }

  let selectedSkills: Skill[] = [];
  let selectedCommands: Command[] = [];

  if (deployType === 'both' || deployType === 'skills') {
    const skillChoices = availableSkills.map((s) => ({
      value: s,
      label: s.name,
      hint: s.description || '',
    }));

    const selected = await multiselect({
      message: 'Select skills',
      options: skillChoices,
      initialValues: availableSkills.filter(s => lastSkills.includes(s.name)),
    });

    if (p.isCancel(selected)) {
      process.exit(1);
    }

    selectedSkills = selected as Skill[];
  }

  if (deployType === 'both' || deployType === 'commands') {
    const commandChoices = availableCommands.map((c) => ({
      value: c,
      label: c.namespace ? `${c.namespace}:${c.name}` : c.name,
      hint: c.description || '',
    }));

    const selected = await multiselect({
      message: 'Select commands',
      options: commandChoices,
      initialValues: availableCommands.filter(c => lastCommands.includes(c.name)),
    });

    if (p.isCancel(selected)) {
      process.exit(1);
    }

    selectedCommands = selected as Command[];
  }

  await saveSelectedAgents(selectedAgents);
  await saveSelectedSkills(selectedSkills.map(s => s.name));
  await saveSelectedCommands(selectedCommands.map(c => c.name));

  return {
    deployType,
    agents: selectedAgents,
    skills: selectedSkills,
    commands: selectedCommands,
  };
}

async function runBatchMode(
  options: DeployOptions,
  availableAgents: AgentType[],
  availableSkills: Skill[],
  availableCommands: Command[]
): Promise<DeployPlan> {
  const selectedAgents = options.agents.length > 0
    ? options.agents.filter(a => availableAgents.includes(a as AgentType)) as AgentType[]
    : availableAgents;

  const selectedSkills = options.skills[0] === '*'
    ? availableSkills
    : availableSkills.filter(s => options.skills.includes(s.name));

  const selectedCommands = options.commands[0] === '*'
    ? availableCommands
    : availableCommands.filter(c => 
        options.commands.includes(c.name) || 
        options.commands.includes(`${c.namespace}:${c.name}`)
      );

  const deployType = selectedSkills.length > 0 && selectedCommands.length > 0
    ? 'both'
    : selectedSkills.length > 0
    ? 'skills'
    : 'commands';

  return {
    deployType,
    agents: selectedAgents,
    skills: selectedSkills,
    commands: selectedCommands,
  };
}

async function executeDeployment(plan: DeployPlan): Promise<void> {
  let totalDeployed = 0;
  let totalFailed = 0;

  for (const agent of plan.agents) {
    const agentConfig = agents[agent];
    const spinner = p.spinner();

    spinner.start(`Deploying to ${agentConfig.displayName}...`);

    let deployed = 0;
    let failed = 0;

    for (const skill of plan.skills) {
      const result = await deploySkill(skill, agent);
      if (result.success) {
        deployed++;
        totalDeployed++;
      } else {
        failed++;
        totalFailed++;
        console.log(`  ${pc.red('✗')} ${skill.name}: ${result.error}`);
      }
    }

    for (const command of plan.commands) {
      const result = await deployCommand(command, agent);
      if (result.success) {
        deployed++;
        totalDeployed++;
      } else {
        failed++;
        totalFailed++;
        console.log(`  ${pc.red('✗')} ${command.name}: ${result.error}`);
      }
    }

    if (failed === 0) {
      spinner.stop(`${pc.green('✓')} ${agentConfig.displayName}`);
    } else {
      spinner.stop(`${pc.yellow('!')} ${agentConfig.displayName} (${deployed} deployed, ${failed} failed)`);
    }
  }

  await updateDeployTimestamp();

  if (totalFailed > 0) {
    p.note(`${totalDeployed} deployed successfully, ${totalFailed} failed`);
  } else {
    console.log(`${pc.dim(`Deployed ${totalDeployed} items to ${plan.agents.length} agent(s)`)}`);
  }
}
