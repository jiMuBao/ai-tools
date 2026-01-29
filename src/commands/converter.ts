import { spawn } from 'child_process';
import { join } from 'path';
import { getProjectRoot } from '../utils.ts';

export async function convertCommandsForGemini(
  inputDir: string,
  outputDir: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptPath = join(getProjectRoot(), 'scripts', 'convert_commands.py');

    const python = spawn('python3', [scriptPath, inputDir, outputDir]);

    let stdout = '';
    let stderr = '';

    python.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
      }
    });

    python.on('error', (error) => {
      reject(new Error(`Failed to run Python: ${error.message}`));
    });
  });
}
