import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Guards CLAUDE.md invariant #4: no hardcoded Tailwind colors in src/.
 * Only Everything ELO tokens (navy, electric-blue, ping-yellow, signal-red,
 * lime, cool-gray, bronze + their *-deep variants + neutrals like white/black)
 * are allowed.
 *
 * Detection: any `${utility}-${tailwindHue}-${shade}` (e.g. `bg-red-500`,
 * `text-blue-400`, `border-green-500/50`). Scans every .ts / .tsx in src/.
 *
 * Allowlist:
 * - dev-only surfaces (DevPanel)
 * - the design-system showcase page (intentionally renders comparisons)
 * - test files themselves
 */

const SRC_ROOT = join(__dirname, '..', '..', '..', 'src');

const TAILWIND_HUES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose',
];

const TAILWIND_PROPS = [
  'bg', 'text', 'border', 'ring', 'outline',
  'from', 'to', 'via', 'divide', 'placeholder',
  'caret', 'fill', 'stroke', 'shadow', 'accent', 'decoration',
];

const SHADES = '(?:50|100|200|300|400|500|600|700|800|900|950)';

const VIOLATION_PATTERN = new RegExp(
  `\\b(?:${TAILWIND_PROPS.join('|')})-(?:${TAILWIND_HUES.join('|')})-${SHADES}(?:/\\d+)?\\b`,
  'g',
);

const ALLOWLIST = new Set(
  [
    'components/DevPanel.tsx',
    'pages/DesignSystemShowcase.tsx',
  ].map((p) => p.split('/').join(sep)),
);

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('No hardcoded Tailwind default colors in src/', () => {
  it('every utility token is an Everything ELO token (or in the allowlist)', () => {
    const violations: Array<{ file: string; line: number; match: string }> = [];

    for (const file of walk(SRC_ROOT)) {
      const rel = relative(SRC_ROOT, file);
      if (ALLOWLIST.has(rel)) continue;

      const content = readFileSync(file, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const matches = line.match(VIOLATION_PATTERN);
        if (matches) {
          for (const match of matches) {
            violations.push({ file: rel, line: i + 1, match });
          }
        }
      }
    }

    if (violations.length > 0) {
      const formatted = violations
        .map((v) => `  ${v.file}:${v.line} → ${v.match}`)
        .join('\n');
      throw new Error(
        `Found ${violations.length} hardcoded Tailwind color${violations.length === 1 ? '' : 's'} (CLAUDE.md invariant #4):\n${formatted}\n\nUse Everything ELO tokens instead (navy, electric-blue, ping-yellow, signal-red, lime, cool-gray, bronze).`,
      );
    }

    expect(violations).toEqual([]);
  });
});
