import {
  mkdir,
  cp,
  symlink,
  lstat,
  rm,
  readdir,
} from 'fs/promises';
import { join, resolve, relative, dirname } from 'path';
import { platform } from 'os';
import type { Skill, DeployResult } from '../types.ts';
import type { AgentType } from '../types.ts';
import { agents } from '../agents.ts';
import { sanitizeName, isPathSafe, getProjectRoot } from '../utils.ts';

const AGENTS_DIR = '.agents';
const SKILLS_SUBDIR = 'skills';

export function getCanonicalSkillsDir(): string {
  return join(process.cwd(), AGENTS_DIR, SKILLS_SUBDIR);
}

export async function createSymlink(target: string, linkPath: string): Promise<boolean> {
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

  const entries = await readdir(src, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.') && entry.name !== 'node_modules')
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

export async function deploySkill(
  skill: Skill,
  agentType: AgentType
): Promise<DeployResult> {
  const agent = agents[agentType];
  const skillName = sanitizeName(skill.name);

  const canonicalDir = join(getCanonicalSkillsDir(), skillName);
  const agentDir = join(agent.globalSkillsDir, skillName);

  if (!isPathSafe(getCanonicalSkillsDir(), canonicalDir)) {
    return {
      success: false,
      path: agentDir,
      mode: 'symlink',
      error: 'Invalid skill name: potential path traversal detected',
    };
  }

  if (!isPathSafe(agent.globalSkillsDir, agentDir)) {
    return {
      success: false,
      path: agentDir,
      mode: 'symlink',
      error: 'Invalid skill name: potential path traversal detected',
    };
  }

  try {
    await mkdir(canonicalDir, { recursive: true });
    await copyDirectory(skill.path, canonicalDir);

    const symlinkCreated = await createSymlink(canonicalDir, agentDir);

    if (!symlinkCreated) {
      await rm(agentDir, { recursive: true, force: true });
      await mkdir(agentDir, { recursive: true });
      await copyDirectory(skill.path, agentDir);

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
