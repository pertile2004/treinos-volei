import { describe, expect, it } from 'vitest';
import config from '../../vite.config.js';

// O painel do Pulse e os endpoints do Livewire (que o painel usa) ficam no Laravel:
// em dev e preview o Vite precisa encaminhá-los, como já faz com /api, /sanctum e /docs.
const CHAVE_LIVEWIRE = '^/livewire-[0-9a-f]{8}/';

describe('proxy do Vite', () => {
  it.each(['/api', '/sanctum', '/docs', '/pulse', CHAVE_LIVEWIRE])(
    'encaminha %s para a API em dev e preview',
    (caminho) => {
      expect(config.server.proxy[caminho]).toBeDefined();
      expect(config.preview.proxy[caminho]).toBe(config.server.proxy[caminho]);
      expect(config.server.proxy[caminho].target).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
    },
  );

  it('a chave do Livewire casa o endpoint de atualizacao do painel e nada parecido', () => {
    const regex = new RegExp(CHAVE_LIVEWIRE);
    expect(regex.test('/livewire-3fa85f64/update')).toBe(true);
    expect(regex.test('/livewire-3fa85f64/livewire.min.js')).toBe(true);
    expect(regex.test('/livewire/update')).toBe(false);
    expect(regex.test('/biblioteca')).toBe(false);
  });
});
