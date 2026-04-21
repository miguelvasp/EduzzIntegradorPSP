import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (
        entry === 'node_modules' ||
        entry === '.git' ||
        entry === 'dist' ||
        entry === 'coverage'
      ) {
        continue;
      }

      files.push(...walk(fullPath));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

describe('sensitive data regression', () => {
  it('nao deve conter documento real obvio na documentacao e artefatos de exemplo', () => {
    const candidateFiles = walk('.').filter((file) => {
      return (
        file.endsWith('.md') ||
        file.endsWith('.example') ||
        file.endsWith('.json') ||
        file.endsWith('.yml') ||
        file.endsWith('.yaml') ||
        file.endsWith('.ts')
      );
    });

    const allowedPaths = ['node_modules', 'dist', 'coverage'];

    const suspiciousPatterns = [
      /\b\d{11}\b/g,
      /\b\d{14}\b/g,
      /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
      /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g,
    ];

    const offenders: string[] = [];

    for (const file of candidateFiles) {
      if (allowedPaths.some((path) => file.includes(path))) {
        continue;
      }

      const content = readFileSync(file, 'utf-8');

      const hasSuspiciousPattern = suspiciousPatterns.some((pattern) => pattern.test(content));

      if (hasSuspiciousPattern) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('env example nao deve conter segredo real obvio', () => {
    const content = readFileSync('.env.example', 'utf-8');

    expect(content).not.toMatch(/Bearer\s+[A-Za-z0-9\-_.]+/);
    expect(content).not.toMatch(/AKIA[0-9A-Z]{16}/);
    expect(content).not.toMatch(/(?<!example_)secret\s*=\s*["']?[A-Za-z0-9/+=_-]{12,}/i);
    expect(content).not.toMatch(/(?<!example_)password\s*=\s*["']?[A-Za-z0-9/+=_-]{8,}/i);
  });
});
