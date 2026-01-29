export type AgentType =
  | 'amp'
  | 'antigravity'
  | 'claude'
  | 'claude-code'
  | 'cline'
  | 'codebuddy'
  | 'codex'
  | 'command-code'
  | 'continue'
  | 'crush'
  | 'cursor'
  | 'droid'
  | 'gemini'
  | 'gemini-cli'
  | 'github-copilot'
  | 'goose'
  | 'junie'
  | 'kilo'
  | 'kimi-cli'
  | 'kiro-cli'
  | 'kode'
  | 'mcpjam'
  | 'moltbot'
  | 'opencode'
  | 'roo'
  | 'rosie'
  | 'sweep';

export interface AgentConfig {
  name: AgentType;
  displayName: string;
  skillsDir: string;
  globalSkillsDir: string;
  commandsDir?: string;
  globalCommandsDir?: string;
  detectInstalled: () => Promise<boolean> | boolean;
}

export interface Skill {
  name: string;
  path: string;
  description?: string;
}

export interface Command {
  name: string;
  path: string;
  namespace: string;
  description?: string;
}

export interface DeployOptions {
  global: boolean;
  agents: AgentType[];
  skills: string[];
  commands: string[];
  yes: boolean;
}

export interface DeployResult {
  success: boolean;
  path: string;
  mode: 'symlink' | 'copy';
  error?: string;
}

export interface DeployPlan {
  deployType: 'both' | 'skills' | 'commands';
  agents: AgentType[];
  skills: Skill[];
  commands: Command[];
}

export interface LockFile {
  version: number;
  lastDeployedAt: string;
  lastSelectedAgents: string[];
  lastSelectedSkills: string[];
  lastSelectedCommands: string[];
}
