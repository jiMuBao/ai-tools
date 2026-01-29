import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { LockFile } from './types.ts';

const LOCK_DIR = join(homedir(), '.ai-tools');
const LOCK_PATH = join(LOCK_DIR, 'lock.json');

export async function loadLock(): Promise<LockFile> {
  try {
    if (!existsSync(LOCK_PATH)) {
      return createDefaultLock();
    }
    const content = await readFile(LOCK_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return createDefaultLock();
  }
}

export async function saveLock(lock: LockFile): Promise<void> {
  try {
    if (!existsSync(LOCK_DIR)) {
      await mkdir(LOCK_DIR, { recursive: true });
    }
    await writeFile(LOCK_PATH, JSON.stringify(lock, null, 2));
  } catch (error) {
    console.warn('Failed to save lock file:', error);
  }
}

function createDefaultLock(): LockFile {
  return {
    version: 1,
    lastDeployedAt: '',
    lastSelectedAgents: [],
    lastSelectedSkills: [],
    lastSelectedCommands: [],
  };
}

export async function getLastSelectedAgents(): Promise<string[]> {
  const lock = await loadLock();
  return lock.lastSelectedAgents || [];
}

export async function getLastSelectedSkills(): Promise<string[]> {
  const lock = await loadLock();
  return lock.lastSelectedSkills || [];
}

export async function getLastSelectedCommands(): Promise<string[]> {
  const lock = await loadLock();
  return lock.lastSelectedCommands || [];
}

export async function saveSelectedAgents(agents: string[]): Promise<void> {
  const lock = await loadLock();
  lock.lastSelectedAgents = agents;
  await saveLock(lock);
}

export async function saveSelectedSkills(skills: string[]): Promise<void> {
  const lock = await loadLock();
  lock.lastSelectedSkills = skills;
  await saveLock(lock);
}

export async function saveSelectedCommands(commands: string[]): Promise<void> {
  const lock = await loadLock();
  lock.lastSelectedCommands = commands;
  await saveLock(lock);
}

export async function updateDeployTimestamp(): Promise<void> {
  const lock = await loadLock();
  lock.lastDeployedAt = new Date().toISOString();
  await saveLock(lock);
}
