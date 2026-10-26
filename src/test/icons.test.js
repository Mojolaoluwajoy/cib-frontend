import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

// Every "ti-*" icon used in the source must exist in the installed icon font, or it renders blank
const require = createRequire(import.meta.url);
const fontCss = readFileSync(require.resolve('@tabler/icons-webfont/tabler-icons.css'), 'utf8');
const sources = import.meta.glob(['../**/*.{js,jsx}', '!../**/*.test.*'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('icons', () => {
  it('only uses icons that exist in the icon font', () => {
    const used = new Set(
      Object.values(sources).flatMap((code) => code.match(/\bti-[a-z0-9]+(?:-[a-z0-9]+)*/g) || []),
    );
    const missing = [...used].filter((name) => !fontCss.includes(`.${name}:before`));
    expect(used.size).toBeGreaterThan(20);
    expect(missing).toEqual([]);
  });
});
