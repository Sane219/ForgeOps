/**
 * Shared Handlebars helpers for ForgeOps artifact generation.
 *
 * Register with:
 *   import { registerHelpers } from '@forgeops/templates';
 *   registerHelpers(handlebarsInstance);
 */
import type Handlebars from 'handlebars';

export function registerHelpers(hbs: typeof Handlebars): void {
  // kebab-case: "MyService" → "my-service", "myService" → "my-service"
  hbs.registerHelper('kebab', (str: string) =>
    str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase(),
  );

  // lowercase
  hbs.registerHelper('lower', (str: string) => str.toLowerCase());

  // wrap in quotes (SafeString to avoid HTML escaping)
  hbs.registerHelper('quote', (str: string) => new hbs.SafeString(`"${str}"`));

  // GitHub Actions expression: {{ghexpr "github.repository_owner"}} → ${{ github.repository_owner }}
  hbs.registerHelper('ghexpr', (expr: string) => new hbs.SafeString(`\${{ ${expr} }}`));

  // Convert millicores to K8s CPU string: 500 → "500m", 1000 → "1", 250 → "250m"
  hbs.registerHelper('cpuToFraction', (millicores: number) => {
    if (millicores >= 1000 && millicores % 1000 === 0) {
      return String(millicores / 1000);
    }
    return `${millicores}m`;
  });

  // Convert MB to K8s memory string: 512 → "512Mi", 1024 → "1Gi"
  hbs.registerHelper('memoryToMi', (mb: number) => {
    if (mb >= 1024 && mb % 1024 === 0) {
      return `${mb / 1024}Gi`;
    }
    return `${mb}Mi`;
  });

  // Format envVars as K8s env block
  // Usage: {{jsonEnv service.envVars}}  → indented env: - name: ... \n   value: ...
  hbs.registerHelper('jsonEnv', (envVars: Array<{ key: string; value: string; secret: boolean }>) => {
    if (!envVars || envVars.length === 0) return '';
    const lines = envVars.map(
      (v) => `            - name: ${v.key}\n              value: "${v.value}"`,
    );
    return new hbs.SafeString(`\n${lines.join('\n')}`);
  });

  // JSON.stringify with indent
  hbs.registerHelper('json', (obj: unknown, indent: number) => {
    const spaces = typeof indent === 'number' ? indent : 2;
    return JSON.stringify(obj, null, spaces);
  });

  // ISO timestamp
  hbs.registerHelper('now', () => new Date().toISOString());

  // Conditional equality: {{#if (eq runtime "NESTJS")}}...{{/if}}
  hbs.registerHelper('eq', (a: unknown, b: unknown) => a === b);

  // Multiply two numbers: {{multiply cpuMillicores 2}}
  hbs.registerHelper('multiply', (a: number, b: number) => a * b);

  // Indent helper: indent N spaces on each line
  hbs.registerHelper('indent', (str: string, spaces: number) => {
    const pad = ' '.repeat(spaces);
    return str
      .split('\n')
      .map((line) => (line.trim() ? `${pad}${line}` : line))
      .join('\n');
  });
}
