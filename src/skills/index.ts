import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import type { Skill } from '../types.ts';
import { getProjectRoot } from '../utils.ts';

async function readSkill(dirPath: string, name: string): Promise<Skill | undefined> {
  try {
    const content = await readFile(join(dirPath, 'SKILL.md'), 'utf-8');
    const { data } = matter(content);
    return { name, path: dirPath, description: data.description };
  } catch {
    return undefined;
  }
}

export async function discoverSkills(): Promise<Skill[]> {
  const skillsDir = join(getProjectRoot(), 'skills');
  const found = new Map<string, Skill>();
  const conflicts: string[] = [];

  let topLevel;
  try {
    topLevel = await readdir(skillsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const register = (skill: Skill): void => {
    const existing = found.get(skill.name);
    if (existing) {
      conflicts.push(`  ${skill.name}: ${existing.path}, ${skill.path}`);
      return;
    }
    found.set(skill.name, skill);
  };

  for (const entry of topLevel) {
    if (!entry.isDirectory()) continue;

    const entryPath = join(skillsDir, entry.name);
    const direct = await readSkill(entryPath, entry.name);
    if (direct) {
      register(direct);
      continue;
    }

    try {
      const subEntries = await readdir(entryPath, { withFileTypes: true });
      for (const sub of subEntries) {
        if (!sub.isDirectory()) continue;
        const nested = await readSkill(join(entryPath, sub.name), sub.name);
        if (nested) register(nested);
      }
    } catch {
      continue;
    }
  }

  if (conflicts.length > 0) {
    throw new Error(`Duplicate skill names detected:\n${conflicts.join('\n')}`);
  }

  return Array.from(found.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSkillByName(name: string): Promise<Skill | undefined> {
  const skills = await discoverSkills();
  return skills.find((skill) => skill.name === name);
}

export function getSkillDisplayName(skill: Skill): string {
  return skill.name;
}
