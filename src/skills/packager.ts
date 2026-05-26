import { createWriteStream } from 'fs';
import { mkdir, readFile, rm, stat } from 'fs/promises';
import { join, resolve } from 'path';
// archiver v8 dropped the callable default export; use the named ZipArchive class.
// @ts-expect-error - @types/archiver v7 only declares the legacy CJS default; runtime exports are named.
import { ZipArchive } from 'archiver';
import type archiver from 'archiver';
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
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return 'SKILL.md not found';
    return `cannot read SKILL.md (${code ?? 'unknown'}): ${err instanceof Error ? err.message : 'unknown error'}`;
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
      error: 'internal error: sanitized archive path escaped outDir',
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
    const archive = new ZipArchive({ zlib: { level: 9 } }) as archiver.Archiver;
    let failed = false;

    const fail = async (error: string) => {
      if (failed) return;
      failed = true;
      // Order: stop further events, then halt the archiver, then unlink the partial file, then resolve.
      archive.removeAllListeners();
      try { archive.abort(); } catch { /* ignore */ }
      try { await rm(archivePath, { force: true }); } catch { /* ignore */ }
      resolvePromise({ success: false, skill: skill.name, path: archivePath, error });
    };

    output.on('error', (err) => { void fail(err.message); });
    archive.on('error', (err) => { void fail(err.message); });
    archive.on('warning', (err) => {
      // ENOENT warnings are benign races (e.g. tmp/swap files vanishing mid-walk).
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') void fail(err.message);
    });

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
    // `skip` prunes the walk (readdir-glob's `ignore` only filters emission, not traversal).
    // `follow: false` avoids infinite loops on symlink cycles; readdir-glob has no
    // depth-limit option, so deref is sacrificed for safety until the design doc is revisited.
    archive.glob('**/*', {
      cwd: skill.path,
      follow: false,
      skip: ['**/node_modules', '**/.*'],
    });

    void archive.finalize();
  });
}
