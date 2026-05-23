import { describe, it, expect, beforeAll } from 'vitest';
import Handlebars from 'handlebars';
import { registerHelpers } from '@forgeops/templates';

let hbs: typeof Handlebars;

beforeAll(() => {
  hbs = Handlebars.create();
  registerHelpers(hbs);
});

describe('kebab', () => {
  it('converts camelCase', () => {
    expect(hbs.compile('{{kebab name}}')({ name: 'myService' })).toBe('my-service');
  });
  it('converts PascalCase', () => {
    expect(hbs.compile('{{kebab name}}')({ name: 'MyService' })).toBe('my-service');
  });
  it('converts spaces', () => {
    expect(hbs.compile('{{kebab name}}')({ name: 'my service' })).toBe('my-service');
  });
  it('converts underscores', () => {
    expect(hbs.compile('{{kebab name}}')({ name: 'my_service' })).toBe('my-service');
  });
});

describe('lower', () => {
  it('lowercases', () => {
    expect(hbs.compile('{{lower name}}')({ name: 'HELLO' })).toBe('hello');
  });
});

describe('quote', () => {
  it('wraps in double quotes', () => {
    const result = hbs.compile('{{quote name}}')({ name: 'test' });
    expect(result).toBe('"test"');
  });
});

describe('cpuToFraction', () => {
  it('converts millicores below 1000', () => {
    expect(hbs.compile('{{cpuToFraction val}}')({ val: 500 })).toBe('500m');
  });
  it('converts exactly 1000 to 1', () => {
    expect(hbs.compile('{{cpuToFraction val}}')({ val: 1000 })).toBe('1');
  });
  it('converts 2000 to 2', () => {
    expect(hbs.compile('{{cpuToFraction val}}')({ val: 2000 })).toBe('2');
  });
  it('converts 250 to 250m', () => {
    expect(hbs.compile('{{cpuToFraction val}}')({ val: 250 })).toBe('250m');
  });
});

describe('memoryToMi', () => {
  it('converts MB below 1024', () => {
    expect(hbs.compile('{{memoryToMi val}}')({ val: 512 })).toBe('512Mi');
  });
  it('converts exactly 1024 to 1Gi', () => {
    expect(hbs.compile('{{memoryToMi val}}')({ val: 1024 })).toBe('1Gi');
  });
  it('converts 2048 to 2Gi', () => {
    expect(hbs.compile('{{memoryToMi val}}')({ val: 2048 })).toBe('2Gi');
  });
  it('keeps 768 as 768Mi', () => {
    expect(hbs.compile('{{memoryToMi val}}')({ val: 768 })).toBe('768Mi');
  });
});

describe('multiply', () => {
  it('multiplies two numbers', () => {
    expect(hbs.compile('{{multiply a b}}')({ a: 500, b: 2 })).toBe('1000');
  });
});

describe('jsonEnv', () => {
  it('returns empty string for empty array', () => {
    const result = hbs.compile('{{jsonEnv vars}}')({ vars: [] });
    expect(result.trim()).toBe('');
  });
  it('formats env vars as K8s env block', () => {
    const result = hbs.compile('{{jsonEnv vars}}')({
      vars: [
        { key: 'NODE_ENV', value: 'production', secret: false },
        { key: 'PORT', value: '4000', secret: false },
      ],
    });
    expect(result).toContain('name: NODE_ENV');
    expect(result).toContain('value: "production"');
    expect(result).toContain('name: PORT');
    expect(result).toContain('value: "4000"');
  });
});

describe('eq', () => {
  it('returns true when equal', () => {
    expect(hbs.compile('{{#if (eq a b)}}yes{{/if}}')({ a: 'NESTJS', b: 'NESTJS' })).toBe('yes');
  });
  it('returns false when not equal', () => {
    expect(hbs.compile('{{#if (eq a b)}}yes{{else}}no{{/if}}')({ a: 'NESTJS', b: 'NEXTJS' })).toBe('no');
  });
});
