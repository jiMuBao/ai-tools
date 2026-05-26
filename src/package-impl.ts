import * as p from '@clack/prompts';
import pc from 'picocolors';
import { resolve } from 'path';
import type { PackageOptions, PackagePlan, Skill } from './types.ts';
import { discoverSkills } from './skills/index.ts';
import { packageSkill } from './skills/packager.ts';
import { getProjectRoot } from './utils.ts';

const DEFAULT_OUT_SUBDIR = 'build/skills';

export function parsePackageOptions(args: string[]): PackageOptions {
  const options: PackageOptions = {
    skills: [],
    out: resolve(getProjectRoot(), DEFAULT_OUT_SUBDIR),
    yes: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--all') {
      options.skills = ['*'];
    } else if (arg === '--yes' || arg === '-y') {
      options.yes = true;
    } else if (arg === '--skill') {
      options.skills = (args[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    } else if (arg === '--out') {
      options.out = resolve(args[++i] || DEFAULT_OUT_SUBDIR);
    }
  }

  return options;
}

function multiselect<Value>(opts: {
  message: string;
  options: Array<{ value: Value; label: string; hint?: string }>;
}) {
  return p.multiselect({
    ...opts,
    options: opts.options as p.Option<Value>[],
    message: `${opts.message} ${pc.dim('(space to toggle)')}`,
  }) as Promise<Value[] | symbol>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function selectSkills(
  options: PackageOptions,
  available: Skill[]
): Promise<Skill[]> {
  if (options.skills[0] === '*') {
    return available;
  }

  if (options.skills.length > 0) {
    const byName = new Map(available.map((s) => [s.name, s]));
    const resolved: Skill[] = [];
    const unknown: string[] = [];
    for (const name of options.skills) {
      const match = byName.get(name);
      if (match) resolved.push(match);
      else unknown.push(name);
    }
    if (unknown.length > 0) {
      throw new Error(
        `Unknown skill(s): ${unknown.join(', ')}. Run 'ai-tools list --skills'.`
      );
    }
    return resolved;
  }

  const selected = await multiselect({
    message: 'Select skills to package',
    options: available.map((s) => ({
      value: s,
      label: s.name,
      hint: s.description || '',
    })),
  });

  if (p.isCancel(selected)) process.exit(1);
  return selected as Skill[];
}

export async function runPackage(options: PackageOptions): Promise<void> {
  p.intro(pc.cyan('AI Tools Package'));

  const available = await discoverSkills();
  if (available.length === 0) {
    p.note('No skills discovered in skills/.');
    p.outro('Nothing to package');
    process.exit(0);
  }

  const skills = await selectSkills(options, available);
  if (skills.length === 0) {
    p.outro('No skills selected');
    process.exit(0);
  }

  const plan: PackagePlan = { skills, out: options.out };

  if (!options.yes && options.skills.length === 0) {
    const confirm = await p.confirm({
      message: `Package ${skills.length} skill(s) → ${plan.out}?`,
    });
    if (p.isCancel(confirm) || !confirm) {
      p.outro('Cancelled');
      process.exit(0);
    }
  }

  let succeeded = 0;
  let failed = 0;

  for (const skill of plan.skills) {
    const spinner = p.spinner();
    spinner.start(`Packaging ${skill.name}...`);
    const result = await packageSkill(skill, plan.out);
    if (result.success) {
      succeeded++;
      spinner.stop(
        `${pc.green('✓')} ${skill.name} → ${result.path} ${pc.dim(`(${formatBytes(result.bytes ?? 0)})`)}`
      );
    } else {
      failed++;
      spinner.stop(`${pc.red('✗')} ${skill.name}: ${result.error}`);
    }
  }

  if (failed > 0) {
    p.outro(`${succeeded} packaged, ${failed} failed`);
    process.exit(1);
  }

  p.outro(`${pc.green('✓')} Packaged ${succeeded} skill(s) → ${plan.out}`);
}
