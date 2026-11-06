import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';
import * as matchersDoAxe from 'vitest-axe/matchers';
import { servidor } from './servidor.js';

// No vitest-axe 0.1.0 o 'vitest-axe/extend-expect' vem vazio: o matcher toHaveNoViolations é registrado aqui.
expect.extend(matchersDoAxe);

beforeAll(() => servidor.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  servidor.resetHandlers();
});
afterAll(() => servidor.close());
