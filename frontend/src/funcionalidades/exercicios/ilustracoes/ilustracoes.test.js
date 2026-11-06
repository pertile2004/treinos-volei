import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ILUSTRACOES, conferirSvg } from './conferirSvg.js';

const pasta = dirname(fileURLToPath(import.meta.url));

function lerSvg(fundamento) {
  const caminho = resolve(pasta, '../../../../public/ilustracoes', `${fundamento}.svg`);
  if (!existsSync(caminho)) {
    throw new Error(`Ilustração não encontrada: ${caminho}`);
  }
  return readFileSync(caminho, 'utf8');
}

const svgValido = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none"',
  ' stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">',
  '<title>Jogador fazendo manchete</title>',
  '<circle cx="40" cy="30" r="6"/>',
  '<g><line x1="6" y1="88" x2="90" y2="88"/></g>',
  '</svg>',
].join('');

describe('ILUSTRACOES', () => {
  it('tem uma entrada por fundamento, com o texto alternativo do rascunho', () => {
    expect(ILUSTRACOES).toEqual({
      recepcao: 'Jogador fazendo manchete',
      levantamento: 'Jogador fazendo toque por cima',
      ataque: 'Jogador saltando para atacar a bola junto à rede',
      saque: 'Jogador lançando a bola para sacar por cima',
      bloqueio: 'Jogador saltando para bloquear a bola sobre a rede',
      defesa: 'Jogador em posição baixa defendendo uma bola rasteira',
      preparo_fisico: 'Pessoa fazendo agachamento com salto',
    });
  });
});

describe.each(Object.entries(ILUSTRACOES))('%s.svg', (fundamento, titulo) => {
  const texto = lerSvg(fundamento);

  it('abre e fecha a tag svg', () => {
    expect(texto.trim().startsWith('<svg')).toBe(true);
    expect(texto.trim().endsWith('</svg>')).toBe(true);
  });

  it('tem o title em português igual ao texto alternativo', () => {
    expect(texto).toContain(`<title>${titulo}</title>`);
  });

  it('passa na conferência das regras do rascunho', () => {
    expect(conferirSvg(texto)).toEqual([]);
  });

  it('é XML bem formado para o analisador do navegador', () => {
    const documento = new DOMParser().parseFromString(texto, 'image/svg+xml');
    expect(documento.querySelector('parsererror')).toBeNull();
    expect(documento.documentElement.nodeName).toBe('svg');
  });
});

describe('conferirSvg', () => {
  it('aceita um SVG dentro das regras', () => {
    expect(conferirSvg(svgValido)).toEqual([]);
  });

  it('recusa texto que não é SVG', () => {
    expect(conferirSvg('')).toContain('O arquivo precisa começar com <svg.');
    expect(conferirSvg('<div></div>').join('\n')).toMatch(/começar com <svg/);
    expect(conferirSvg(null).join('\n')).toMatch(/começar com <svg/);
  });

  it('recusa svg sem fechamento', () => {
    const problemas = conferirSvg(svgValido.replace('</svg>', ''));
    expect(problemas).toContain('O arquivo precisa terminar com </svg>.');
  });

  it('recusa tag aberta sem fechar e fechamento trocado', () => {
    expect(conferirSvg(svgValido.replace('</g>', '')).join('\n')).toMatch(/mal formado/);
    expect(conferirSvg(svgValido.replace('</g>', '</path>')).join('\n')).toMatch(/mal formado/);
  });

  it('recusa title ausente, vazio ou repetido', () => {
    const semTitle = svgValido.replace('<title>Jogador fazendo manchete</title>', '');
    expect(conferirSvg(semTitle).join('\n')).toMatch(/<title>/);
    const vazio = svgValido.replace('Jogador fazendo manchete', '  ');
    expect(conferirSvg(vazio).join('\n')).toMatch(/<title>/);
    const repetido = svgValido.replace('</svg>', '<title>Outro</title></svg>');
    expect(conferirSvg(repetido).join('\n')).toMatch(/<title>/);
  });

  it.each([
    ['viewBox="0 0 96 96"', 'viewBox="0 0 24 24"', /viewBox/],
    ['stroke="currentColor"', 'stroke="#1d4ed8"', /stroke="currentColor"/],
    ['fill="none"', 'fill="black"', /fill="none"/],
    ['stroke-width="3"', 'stroke-width="2"', /stroke-width="3"/],
    ['stroke-linecap="round"', 'stroke-linecap="butt"', /stroke-linecap="round"/],
    ['stroke-linejoin="round"', 'stroke-linejoin="miter"', /stroke-linejoin="round"/],
  ])('recusa a tag svg sem %s', (certo, errado, esperado) => {
    expect(conferirSvg(svgValido.replace(certo, errado)).join('\n')).toMatch(esperado);
  });

  it('recusa largura e altura fixas na tag svg', () => {
    const fixo = svgValido.replace('<svg ', '<svg width="96" height="96" ');
    expect(conferirSvg(fixo).join('\n')).toMatch(/width.*height/);
  });

  it('não confunde stroke-width com width', () => {
    expect(conferirSvg(svgValido).join('\n')).not.toMatch(/width.*height/);
  });

  it.each([
    ['<text x="1" y="1">a</text>', /<text>/],
    ['<image href="a.png"/>', /<image>/],
    ['<style>.a{}</style>', /<style>/],
    ['<script>1</script>', /<script>/],
    ['<polygon points="1,1 2,2 3,1"/>', /<polygon>/],
  ])('recusa elemento fora da lista: %s', (trecho, esperado) => {
    expect(conferirSvg(svgValido.replace('</svg>', `${trecho}</svg>`)).join('\n')).toMatch(esperado);
  });

  it('recusa cor fixa em qualquer elemento', () => {
    const comHex = svgValido.replace('<circle ', '<circle stroke="#ff0000" ');
    expect(conferirSvg(comHex).join('\n')).toMatch(/cor fixa/);
    const comRgb = svgValido.replace('<circle ', '<circle fill="rgb(0,0,0)" ');
    expect(conferirSvg(comRgb).join('\n')).toMatch(/cor fixa/);
    const comNome = svgValido.replace('<circle ', '<circle stroke="red" ');
    expect(conferirSvg(comNome).join('\n')).toMatch(/cor fixa/);
  });
});
