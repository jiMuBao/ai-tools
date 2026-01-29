import {
  mkdir,
  cp,
  symlink,
  lstat,
  rm,
} from 'fs/promises';
import {
  join,
  dirname,
  basename,
  resolve,
  relative,
} from 'path';
import { platform } from 'os';
import type { Command, DeployResult } from '../types.ts';
import type { AgentType } from '../types.ts';
import { agents } from '../agents.ts';
import { convertCommandsForGemini } from './converter.ts';
import { isPathSafe, getProjectRoot } from '../utils.ts';

const COMMANDS_SUBDIR = '.commands';

export function getCanonicalCommandsDir(): string {
  return join(getProjectRoot(), COMMANDS_SUBDIR);
}

async function createSymlink(target: string, linkPath: string): Promise<boolean> {
  try {
    const resolvedTarget = resolve(target);
    const resolvedLinkPath = resolve(linkPath);

    if (resolvedTarget === resolvedLinkPath) {
      return true;
    }

    try {
      const stats = await lstat(linkPath);
      if (stats.isSymbolicLink()) {
        await rm(linkPath);
      } else {
        await rm(linkPath, { recursive: true });
      }
    } catch {
    }

    const linkDir = dirname(linkPath);
    await mkdir(linkDir, { recursive: true });

    const relativePath = relative(linkDir, target);
    const symlinkType = platform() === 'win32' ? 'junction' : undefined;

    await symlink(relativePath, linkPath, symlinkType);
    return true;
  } catch {
    return false;
  }
}

async function copyDirectory(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });

  const entries = await (await import('fs/promises')).readdir(src, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.'))
      .map(async (entry) => {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);

        if (entry.isDirectory()) {
          await copyDirectory(srcPath, destPath);
        } else {
          await cp(srcPath, destPath, {
            dereference: true,
            recursive: true,
          });
        }
      })
  );
}

export async function deployCommand(
  command: Command,
  agentType: AgentType
): Promise<DeployResult> {
  const agent = agents[agentType];

  if (!agent.commandsDir || !agent.globalCommandsDir) {
    return {
      success: false,
      path: '',
      mode: 'symlink',
      error: `${agent.displayName} does not support commands`,
    };
  }

  const agentDir = join(agent.globalCommandsDir, command.namespace || command.name);

  if (!isPathSafe(agent.globalCommandsDir, agentDir)) {
    return {
      success: false,
      path: agentDir,
      mode: 'symlink',
      error: 'Invalid command name: potential path traversal detected',
    };
  }

  try {
    if (agentType === 'gemini' || agentType === 'gemini-cli') {
      const buildDir = join(getProjectRoot(), 'build', 'gemini-commands');

      await convertCommandsForGemini(join(getProjectRoot(), 'commands'), buildDir);

      const canonicalPath = join(buildDir, command.namespace || command.name);

      const symlinkCreated = await createSymlink(canonicalPath, agentDir);

      if (!symlinkCreated) {
        await rm(agentDir, { recursive: true, force: true });
        await mkdir(agentDir, { recursive: true });

        const convertedPath = join(buildDir, command.namespace || command.name, `${command.name}.toml`);
        await cp(convertedPath, join(agentDir, basename(convertedPath)));
      }

      return {
        success: true,
        path: agentDir,
        mode: 'symlink',
      };
    }

    const canonicalDir = join(getCanonicalCommandsDir(), command.namespace || command.name);
    const canonicalFile = join(canonicalDir, basename(command.path));

    if (!isPathSafe(getCanonicalCommandsDir(), canonicalDir)) {
      return {
        success: false,
        path: agentDir,
        mode: 'symlink',
        error: 'Invalid command name: potential path traversal detected',
      };
    }

    await mkdir(canonicalDir, { recursive: true });
    await cp(command.path, canonicalFile);

    const symlinkCreated = await createSymlink(canonicalDir, agentDir);

    if (!symlinkCreated) {
      await rm(agentDir, { recursive: true, force: true });
      await mkdir(agentDir, { recursive: true });
      await cp(command.path, join(agentDir, basename(command.path)));

      return {
        success: true,
        path: agentDir,
        mode: 'symlink',
      };
    }

    return {
      success: true,
      path: agentDir,
      mode: 'symlink',
    };
  } catch (error) {
    return {
      success: false,
      path: agentDir,
      mode: 'symlink',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
