import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Ilustracao, { ehCaminhoDaPropriaOrigem } from './Ilustracao.jsx';

describe('Ilustracao', () => {
  it('desenha a mascara decorativa para um caminho relativo da propria origem', () => {
    const { container } = render(<Ilustracao src="/ilustracoes/saque.svg" className="size-16" />);
    const ilustracao = container.querySelector('[data-ilustracao]');
    expect(ilustracao).toHaveAttribute('aria-hidden', 'true');
    expect(ilustracao.style.maskImage).toBe('url("/ilustracoes/saque.svg")');
    expect(ilustracao).toHaveClass('size-16');
  });

  it('nao desenha nada sem imagem', () => {
    const { container } = render(<Ilustracao src={null} />);
    expect(container.querySelector('[data-ilustracao]')).toBeNull();
  });

  it.each([
    'https://terceiro.exemplo/rastreador.svg',
    'http://terceiro.exemplo/rastreador.svg',
    '//terceiro.exemplo/rastreador.svg',
    '/\terceiro.exemplo/rastreador.svg',
    'data:image/svg+xml,<svg/>',
    'ilustracoes/saque.svg',
    '/ilustracoes/saque.svg") url("https://terceiro.exemplo/x.svg',
    '/ilustracoes/sa que.svg',
  ])('ignora a imagem fora da propria origem ou malformada: %s', (src) => {
    const { container } = render(<Ilustracao src={src} />);
    expect(container.querySelector('[data-ilustracao]')).toBeNull();
    expect(ehCaminhoDaPropriaOrigem(src)).toBe(false);
  });

  it('aceita os caminhos das ilustracoes do seeder', () => {
    for (const fundamento of ['saque', 'passe', 'levantamento', 'ataque', 'bloqueio', 'defesa', 'recepcao']) {
      expect(ehCaminhoDaPropriaOrigem(`/ilustracoes/${fundamento}.svg`)).toBe(true);
    }
  });
});
