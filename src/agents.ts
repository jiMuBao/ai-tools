import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';
import type { AgentConfig, AgentType } from './types.ts';

const home = homedir();
const claudeHome = process.env.CLAUDE_CONFIG_DIR?.trim() || join(home, '.claude');
const codexHome = process.env.CODEX_HOME?.trim() || join(home, '.codex');

export const agents: Record<AgentType, AgentConfig> = {
  amp: {
    name: 'amp',
    displayName: 'Amp',
    skillsDir: '.agents/skills',
    globalSkillsDir: join(home, '.config/agents/skills'),
    detectInstalled: async () => existsSync(join(home, '.config/amp')),
  },
  antigravity: {
    name: 'antigravity',
    displayName: 'Antigravity',
    skillsDir: '.agent/skills',
    globalSkillsDir: join(home, '.gemini/antigravity/global_skills'),
    detectInstalled: async () =>
      existsSync(join(process.cwd(), '.agent')) || existsSync(join(home, '.gemini/antigravity')),
  },
  claude: {
    name: 'claude',
    displayName: 'Claude',
    skillsDir: '.claude/skills',
    globalSkillsDir: join(claudeHome, 'skills'),
    commandsDir: '.claude/commands',
    globalCommandsDir: join(claudeHome, 'commands'),
    detectInstalled: async () => existsSync(claudeHome),
  },
  'claude-code': {
    name: 'claude-code',
    displayName: 'Claude Code',
    skillsDir: '.claude/skills',
    globalSkillsDir: join(claudeHome, 'skills'),
    commandsDir: '.claude/commands',
    globalCommandsDir: join(claudeHome, 'commands'),
    detectInstalled: async () => existsSync(claudeHome),
  },
  cline: {
    name: 'cline',
    displayName: 'Cline',
    skillsDir: '.cline/skills',
    globalSkillsDir: join(home, '.cline/skills'),
    detectInstalled: async () => existsSync(join(home, '.cline')),
  },
  codebuddy: {
    name: 'codebuddy',
    displayName: 'CodeBuddy',
    skillsDir: '.codebuddy/skills',
    globalSkillsDir: join(home, '.codebuddy/skills'),
    detectInstalled: async () =>
      existsSync(join(process.cwd(), '.codebuddy')) || existsSync(join(home, '.codebuddy')),
  },
  codex: {
    name: 'codex',
    displayName: 'Codex',
    skillsDir: '.codex/skills',
    globalSkillsDir: join(codexHome, 'skills'),
    commandsDir: '.codex/commands',
    globalCommandsDir: join(codexHome, 'commands'),
    detectInstalled: async () => existsSync(codexHome) || existsSync('/etc/codex'),
  },
  'command-code': {
    name: 'command-code',
    displayName: 'Command Code',
    skillsDir: '.commandcode/skills',
    globalSkillsDir: join(home, '.commandcode/skills'),
    commandsDir: '.commandcode/commands',
    globalCommandsDir: join(home, '.commandcode/commands'),
    detectInstalled: async () => existsSync(join(home, '.commandcode')),
  },
  continue: {
    name: 'continue',
    displayName: 'Continue',
    skillsDir: '.continue/skills',
    globalSkillsDir: join(home, '.continue/skills'),
    detectInstalled: async () =>
      existsSync(join(process.cwd(), '.continue')) || existsSync(join(home, '.continue')),
  },
  crush: {
    name: 'crush',
    displayName: 'Crush',
    skillsDir: '.crush/skills',
    globalSkillsDir: join(home, '.config/crush/skills'),
    detectInstalled: async () => existsSync(join(home, '.config/crush')),
  },
  cursor: {
    name: 'cursor',
    displayName: 'Cursor',
    skillsDir: '.cursor/skills',
    globalSkillsDir: join(home, '.cursor/skills'),
    detectInstalled: async () => existsSync(join(home, '.cursor')),
  },
  droid: {
    name: 'droid',
    displayName: 'Droid',
    skillsDir: '.factory/skills',
    globalSkillsDir: join(home, '.factory/skills'),
    detectInstalled: async () => existsSync(join(home, '.factory')),
  },
  gemini: {
    name: 'gemini',
    displayName: 'Gemini',
    skillsDir: '.gemini/skills',
    globalSkillsDir: join(home, '.gemini/skills'),
    commandsDir: '.gemini/commands',
    globalCommandsDir: join(home, '.gemini/commands'),
    detectInstalled: async () => existsSync(join(home, '.gemini')),
  },
  'gemini-cli': {
    name: 'gemini-cli',
    displayName: 'Gemini CLI',
    skillsDir: '.gemini/skills',
    globalSkillsDir: join(home, '.gemini/skills'),
    commandsDir: '.gemini/commands',
    globalCommandsDir: join(home, '.gemini/commands'),
    detectInstalled: async () => existsSync(join(home, '.gemini')),
  },
  'github-copilot': {
    name: 'github-copilot',
    displayName: 'GitHub Copilot',
    skillsDir: '.github/skills',
    globalSkillsDir: join(home, '.copilot/skills'),
    commandsDir: '.github/commands',
    globalCommandsDir: join(home, '.copilot/commands'),
    detectInstalled: async () =>
      existsSync(join(process.cwd(), '.github')) || existsSync(join(home, '.copilot')),
  },
  goose: {
    name: 'goose',
    displayName: 'Goose',
    skillsDir: '.goose/skills',
    globalSkillsDir: join(home, '.config/goose/skills'),
    detectInstalled: async () => existsSync(join(home, '.config/goose')),
  },
  junie: {
    name: 'junie',
    displayName: 'Junie',
    skillsDir: '.junie/skills',
    globalSkillsDir: join(home, '.junie/skills'),
    detectInstalled: async () => existsSync(join(home, '.junie')),
  },
  kilo: {
    name: 'kilo',
    displayName: 'Kilo Code',
    skillsDir: '.kilocode/skills',
    globalSkillsDir: join(home, '.kilocode/skills'),
    detectInstalled: async () => existsSync(join(home, '.kilocode')),
  },
  'kimi-cli': {
    name: 'kimi-cli',
    displayName: 'Kimi Code CLI',
    skillsDir: '.agents/skills',
    globalSkillsDir: join(home, '.config/agents/skills'),
    detectInstalled: async () => existsSync(join(home, '.kimi')),
  },
  'kiro-cli': {
    name: 'kiro-cli',
    displayName: 'Kiro CLI',
    skillsDir: '.kiro/skills',
    globalSkillsDir: join(home, '.kiro/skills'),
    detectInstalled: async () => existsSync(join(home, '.kiro')),
  },
  kode: {
    name: 'kode',
    displayName: 'Kode',
    skillsDir: '.kode/skills',
    globalSkillsDir: join(home, '.kode/skills'),
    detectInstalled: async () => existsSync(join(home, '.kode')),
  },
  mcpjam: {
    name: 'mcpjam',
    displayName: 'MCPJam',
    skillsDir: '.mcpjam/skills',
    globalSkillsDir: join(home, '.mcpjam/skills'),
    detectInstalled: async () => existsSync(join(home, '.mcpjam')),
  },
  moltbot: {
    name: 'moltbot',
    displayName: 'Moltbot',
    skillsDir: 'skills',
    globalSkillsDir: existsSync(join(home, '.clawdbot'))
      ? join(home, '.clawdbot/skills')
      : join(home, '.moltbot/skills'),
    detectInstalled: async () => existsSync(join(home, '.moltbot')) || existsSync(join(home, '.clawdbot')),
  },
  opencode: {
    name: 'opencode',
    displayName: 'OpenCode',
    skillsDir: '.opencode/skill',
    globalSkillsDir: join(home, '.config/opencode/skill'),
    commandsDir: '.opencode/command',
    globalCommandsDir: join(home, '.config/opencode/command'),
    detectInstalled: async () => existsSync(join(home, '.config/opencode')),
  },
  roo: {
    name: 'roo',
    displayName: 'Roo',
    skillsDir: '.roo/skills',
    globalSkillsDir: join(home, '.roo/skills'),
    detectInstalled: async () => existsSync(join(home, '.roo')),
  },
  rosie: {
    name: 'rosie',
    displayName: 'Rosie',
    skillsDir: '.rosie/skills',
    globalSkillsDir: join(home, '.rosie/skills'),
    detectInstalled: async () => existsSync(join(home, '.rosie')),
  },
  sweep: {
    name: 'sweep',
    displayName: 'Sweep',
    skillsDir: '.sweep/skills',
    globalSkillsDir: join(home, '.sweep/skills'),
    detectInstalled: async () => existsSync(join(home, '.sweep')),
  },
};

export async function detectInstalledAgents(): Promise<AgentType[]> {
  const installed: AgentType[] = [];

  for (const [key, agent] of Object.entries(agents)) {
    try {
      const isInstalled = await agent.detectInstalled();
      if (isInstalled) {
        installed.push(key as AgentType);
      }
    } catch {
      continue;
    }
  }

  return installed;
}

export function getAgentNames(agentTypes: AgentType[]): string[] {
  return agentTypes.map((type) => agents[type].displayName);
}
