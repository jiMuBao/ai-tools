import { createWriteStream } from 'fs';
import { mkdir, readFile, rm, stat } from 'fs/promises';
import { join, resolve } from 'path';
import archiver from 'archiver';
import matter from 'gray-matter';
import type { Skill, PackageResult } from '../types.ts';
import { isPathSafe, sanitizeName } from '../utils.ts';

async function validateFrontmatter(skillPath: string): Promise<string | undefined> {
  try {
    const content = await readFile(join(skillPath, 'SKILL.md'), 'utf-8');
    const { data } = matter(content);
    const description = typeof data.description === 'string' ? data.description.trim() : '';
    if (!description) {
      return 'missing description in SKILL.md frontmatter';
    }
  } catch (err) {
    return `cannot read SKILL.md: ${err instanceof Error ? err.message : 'unknown error'}`;
  }
  return undefined;
}

export async function packageSkill(skill: Skill, outDir: string): Promise<PackageResult> {
  const archiveName = `${sanitizeName(skill.name)}.skill`;
  const archivePath = resolve(outDir, archiveName);

  if (!isPathSafe(resolve(outDir), archivePath)) {
    return {
      success: false,
      skill: skill.name,
      path: archivePath,
      error: 'invalid skill name: potential path traversal detected',
    };
  }

  const validationError = await validateFrontmatter(skill.path);
  if (validationError) {
    return { success: false, skill: skill.name, path: archivePath, error: validationError };
  }

  try {
    await mkdir(outDir, { recursive: true });
    await rm(archivePath, { force: true });
  } catch (err) {
    return {
      success: false,
      skill: skill.name,
      path: archivePath,
      error: `cannot prepare output: ${err instanceof Error ? err.message : 'unknown error'}`,
    };
  }

  return new Promise<PackageResult>((resolvePromise) => {
    const output = createWriteStream(archivePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    let failed = false;

    const fail = async (error: string) => {
      if (failed) return;
      failed = true;
      archive.removeAllListeners();
      try { archive.abort(); } catch { /* ignore */ }
      try { await rm(archivePath, { force: true }); } catch { /* ignore */ }
      resolvePromise({ success: false, skill: skill.name, path: archivePath, error });
    };

    output.on('error', (err) => { void fail(err.message); });
    archive.on('error', (err) => { void fail(err.message); });
    archive.on('warning', (err) => { void fail(err.message); });

    output.on('close', async () => {
      if (failed) return;
      try {
        const { size } = await stat(archivePath);
        resolvePromise({
          success: true,
          skill: skill.name,
          path: archivePath,
          bytes: size,
        });
      } catch (err) {
        void fail(err instanceof Error ? err.message : 'unknown error');
      }
    });

    archive.pipe(output);
    archive.glob('**/*', {
      cwd: skill.path,
      dot: false,
      follow: true,
      ignore: ['node_modules/**', '.*', '**/.*'],
    });

    void archive.finalize();
  });
}
