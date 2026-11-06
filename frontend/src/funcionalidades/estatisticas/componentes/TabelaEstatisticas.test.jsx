import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { MES, ROTULOS_DOS_FUNDAMENTOS, SEMANA } from '../../../testes/exemplosDeEstatisticas.js';
import TabelaEstatisticas from './TabelaEstatisticas.jsx';

function celulas(tabela) {
  return within(tabela)
    .getAllByRole('row')
    .map((linha) => [...linha.querySelectorAll('th, td')].map((celula) => celula.textContent));
}

describe('TabelaEstatisticas', () => {
  it('tabela de volume tem caption, cabecalhos com scope e os mesmos minutos dos pontos', () => {
    render(<TabelaEstatisticas estatisticas={SEMANA} rotulos={ROTULOS_DOS_FUNDAMENTOS} />);
    const tabela = screen.getByRole('table', { name: 'Volume de treino (min)' });
    for (const cabecalho of within(tabela).getAllByRole('columnheader'))
      expect(cabecalho).toHaveAttribute('scope', 'col');
    for (const cabecalho of within(tabela).getAllByRole('rowheader')) expect(cabecalho).toHaveAttribute('scope', 'row');
    expect(celulas(tabela)).toEqual([
      ['Período', 'Minutos'],
      ['Segunda-feira, 02/11', '45'],
      ['Terça-feira, 03/11', '0'],
      ['Quarta-feira, 04/11', '60'],
      ['Quinta-feira, 05/11', '0'],
      ['Sexta-feira, 06/11', '0'],
      ['Sábado, 07/11', '0'],
      ['Domingo, 08/11', '0'],
    ]);
  });

  it('tabela de performance mostra acertos, erros e % de acerto, com "sem dados" no lugar de 0%', () => {
    render(<TabelaEstatisticas estatisticas={SEMANA} rotulos={ROTULOS_DOS_FUNDAMENTOS} />);
    const tabela = screen.getByRole('table', { name: 'Performance por fundamento' });
    expect(celulas(tabela)).toEqual([
      ['Fundamento', 'Acertos', 'Erros', '% de acerto'],
      ['Recepção', '42', '18', '70%'],
      ['Levantamento', '0', '0', 'sem dados'],
      ['Ataque', '0', '0', 'sem dados'],
      ['Saque', '15', '5', '75%'],
      ['Bloqueio', '0', '0', 'sem dados'],
      ['Defesa', '0', '0', 'sem dados'],
      ['Preparo físico', '0', '0', 'sem dados'],
    ]);
  });

  it('periodo por semana rotula cada linha com o intervalo e mostra 0% real', () => {
    render(<TabelaEstatisticas estatisticas={MES} rotulos={ROTULOS_DOS_FUNDAMENTOS} />);
    const volume = screen.getByRole('table', { name: 'Volume de treino (min)' });
    expect(celulas(volume)[1]).toEqual(['12/10 a 18/10', '90']);
    const performance = screen.getByRole('table', { name: 'Performance por fundamento' });
    expect(celulas(performance)[3]).toEqual(['Ataque', '0', '4', '0%']);
    expect(celulas(performance)[1]).toEqual(['Recepção', '100', '50', '66,7%']);
  });

  it('nao tem violacoes de acessibilidade', async () => {
    const { container } = render(<TabelaEstatisticas estatisticas={SEMANA} rotulos={ROTULOS_DOS_FUNDAMENTOS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
