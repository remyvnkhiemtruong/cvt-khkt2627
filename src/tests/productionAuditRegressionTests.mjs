import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(path, 'utf8');
let passed = 0;

const test = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log('✓', name);
  } catch (error) {
    console.error('✗', name);
    throw error;
  }
};

await test('PA01: production rubric fallback never invents a catalog id', () => {
  const source = read('src/contexts/PortfolioContext.tsx');
  assert(source.includes("const emptyRubric: RubricMatrix = { id: '',"));
  assert(!source.includes("const emptyRubric: RubricMatrix = { id: 'rubric-poetics-std'"));
});

await test('PA02: modal keeps viewport safety and traps focus', () => {
  const source = read('src/components/ui/Modal.tsx');
  assert(source.includes('createPortal('));
  assert(source.includes('max-h-[calc(100dvh-1.5rem)]'));
  assert(source.includes("event.key !== 'Tab'"));
  assert(source.includes('previousFocusRef.current?.focus()'));
  assert(source.includes('aria-labelledby'));
});

await test('PA03: dropdown exposes keyboard and ARIA menu semantics', () => {
  const source = read('src/components/ui/Dropdown.tsx');
  assert(source.includes("'aria-expanded': isOpen"));
  assert(source.includes("event.key === 'ArrowDown'"));
  assert(source.includes("event.key === 'ArrowUp'"));
  assert(source.includes("event.key === 'Escape'"));
  assert(source.includes("role=\"menuitem\""));
});

await test('PA04: production CSP blocks framing/object injection while allowing app fonts', () => {
  const source = read('vercel.json');
  assert(source.includes('Content-Security-Policy'));
  assert(source.includes("object-src 'none'"));
  assert(source.includes("frame-ancestors 'none'"));
  assert(source.includes('fonts.googleapis.com'));
  assert(source.includes('fonts.gstatic.com'));
});

console.log(`Production audit regressions: ${passed}/4 passed`);
