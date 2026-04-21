import { readFileSync } from 'node:fs';

export function loadJsonDataset<T>(filePath: string): T {
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}
