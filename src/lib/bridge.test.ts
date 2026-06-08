import { describe, it, expect } from 'vitest';
import { validateOrigin, validateUrl, isSameOrigin } from './bridge';

describe('validateOrigin', () => {
  it('returns true for matching origins', () => {
    expect(
      validateOrigin('http://localhost:7777', 'http://localhost:7777'),
    ).toBe(true);
  });

  it('returns false for different origins', () => {
    expect(
      validateOrigin('http://localhost:7777', 'http://localhost:6001'),
    ).toBe(false);
  });

  it('returns false for empty strings', () => {
    expect(validateOrigin('', 'http://localhost:7777')).toBe(false);
    expect(validateOrigin('http://localhost:7777', '')).toBe(false);
  });
});

describe('validateUrl', () => {
  it('accepts http URLs', () => {
    expect(validateUrl('http://localhost:6001')).toBe(true);
  });

  it('accepts https URLs', () => {
    expect(validateUrl('https://example.com')).toBe(true);
  });

  it('rejects javascript: URLs', () => {
    expect(validateUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects data: URLs', () => {
    expect(validateUrl('data:text/html,<h1>hi</h1>')).toBe(false);
  });

  it('rejects invalid URLs', () => {
    expect(validateUrl('not-a-url')).toBe(false);
  });
});

describe('isSameOrigin', () => {
  it('returns true for same origin as current window', () => {
    // jsdom sets window.location.href to 'http://localhost:3000' or similar
    const currentOrigin = window.location.origin;
    expect(isSameOrigin(`${currentOrigin}/some/path`)).toBe(true);
  });

  it('returns false for different origin', () => {
    expect(isSameOrigin('https://example.com')).toBe(false);
  });

  it('returns false for invalid URL', () => {
    expect(isSameOrigin('not-valid')).toBe(false);
  });
});
