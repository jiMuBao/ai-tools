import { join, resolve, relative, dirname } from 'path';
import { homedir } from 'os';

export function shortenPath(fullPath: string): string {
  const home = homedir();
  const cwd = process.cwd();

  if (fullPath.startsWith(home)) {
    return fullPath.replace(home, '~');
  }
  if (fullPath.startsWith(cwd)) {
    return '.' + fullPath.slice(cwd.length);
  }
  return fullPath;
}

export function sanitizeName(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, '-')
    .replace(/^[.\-]+|[.\-]+$/g, '');
  return sanitized.substring(0, 255) || 'unnamed';
}

export function formatList(items: string[], maxShow: number = 5): string {
  if (items.length <= maxShow) {
    return items.join(', ');
  }
  const shown = items.slice(0, maxShow);
  const remaining = items.length - maxShow;
  return `${shown.join(', ')} +${remaining} more`;
}

export function getProjectRoot(): string {
  return resolve(join(import.meta.url?.replace('file://', '') || '', '..', '..'));
}

export function isPathSafe(basePath: string, targetPath: string): boolean {
  const normalizedBase = resolve(basePath);
  const normalizedTarget = resolve(targetPath);
  return normalizedTarget.startsWith(normalizedBase) || normalizedTarget === normalizedBase;
}
