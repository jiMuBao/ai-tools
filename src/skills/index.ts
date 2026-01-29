import { readdir } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';
import type { Skill } from '../types.ts';
import { getProjectRoot } from '../utils.ts';

export async function discoverSkills(): Promise<Skill[]> {
  const skillsDir = join(getProjectRoot(), 'skills');
  const skills: Skill[] = [];

  try {
    const entries = await readdir(skillsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const skillPath = join(skillsDir, entry.name);
      const skillMdPath = join(skillPath, 'SKILL.md');

      try {
        const content = await import('fs').then(fs => fs.readFileSync(skillMdPath, 'utf-8'));
        const { data } = matter(content);

        skills.push({
          name: entry.name,
          path: skillPath,
          description: data.description,
        });
      } catch {
        continue;
      }
    }
  } catch {
    return [];
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSkillByName(name: string): Promise<Skill | undefined> {
  const skills = await discoverSkills();
  return skills.find((skill) => skill.name === name);
}

export function getSkillDisplayName(skill: Skill): string {
  return skill.name;
}
