import { readdir } from 'fs/promises';
import { join, relative } from 'path';
import matter from 'gray-matter';
import type { Command } from '../types.ts';
import { getProjectRoot } from '../utils.ts';

export async function discoverCommands(): Promise<Command[]> {
  const commandsDir = join(getProjectRoot(), 'commands');
  const commands: Command[] = [];

  async function scanDirectory(dirPath: string, namespace: string): Promise<void> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          const subNamespace = namespace ? `${namespace}:${entry.name}` : entry.name;
          await scanDirectory(fullPath, subNamespace);
        } else if (entry.name.endsWith('.md')) {
          try {
            const content = await import('fs').then(fs => fs.readFileSync(fullPath, 'utf-8'));
            const { data } = matter(content);
            const commandName = entry.name.replace('.md', '');

            commands.push({
              name: commandName,
              path: fullPath,
              namespace: namespace || '',
              description: data.description,
            });
          } catch {
            continue;
          }
        }
      }
    } catch {
    }
  }

  await scanDirectory(commandsDir, '');
  return commands.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCommandByName(name: string): Promise<Command | undefined> {
  const commands = await discoverCommands();
  return commands.find((cmd) => cmd.name === name || `${cmd.namespace}:${cmd.name}` === name);
}
