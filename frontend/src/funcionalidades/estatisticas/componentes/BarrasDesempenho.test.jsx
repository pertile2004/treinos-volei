import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { MES, ROTULOS_DOS_FUNDAMENTOS, SEMANA } from '../../../testes/exemplosDeEstatisticas.js';
import BarrasDesempenho from './BarrasDesempenho.jsx';

function linha(nome) {
  return screen.getAllByRole('listitem').find((item) => within(item).queryByText(nome));
}

describe('BarrasDesempenho', () => {
  it('mostra uma barra por fundamento, na ordem do servidor, com o rotulo das referencias', () => {
    render(<BarrasDesempenho desempenho={SEMANA.desempenho} rotulos={ROTULOS_DOS_FUNDAMENTOS} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Performance por fundamento' })).toBeInTheDocument();
    const nomes = screen
      .getAllByRole('listitem')
      .map((item) => within(item).getByRole('progressbar').getAttribute('aria-label'));
    expect(nomes).toEqual([
      'Acerto em Recepção',
      'Acerto em Levantamento',
      'Acerto em Ataque',
      'Acerto em Saque',
      'Acerto em Bloqueio',
      'Acerto em Defesa',
      'Acerto em Preparo físico',
    ]);
  });

  it('fundamento com tentativas mostra o percentual em texto e na barra', () => {
    render(<BarrasDesempenho desempenho={SEMANA.desempenho} rotulos={ROTULOS_DOS_FUNDAMENTOS} />);
    const recepcao = linha('Recepção');
    expect(within(recepcao).getByText('70%')).toBeInTheDocument();
    expect(within(recepcao).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '70');
  });

  it('fundamento sem tentativas mostra "sem dados" e nunca 0%', () => {
    render(<BarrasDesempenho desempenho={SEMANA.desempenho} rotulos={ROTULOS_DOS_FUNDAMENTOS} />);
    const levantamento = linha('Levantamento');
    expect(levantamento).toHaveTextContent(/sem dados/i);
    expect(levantamento).not.toHaveTextContent('0%');
    const barra = within(levantamento).getByRole('progressbar');
    expect(barra).not.toHaveAttribute('aria-valuenow');
    expect(barra).toHaveAttribute('aria-valuetext', expect.stringMatching(/sem dados/i));
  });

  it('zero por cento real (so erros) aparece como 0%', () => {
    render(<BarrasDesempenho desempenho={MES.desempenho} rotulos={ROTULOS_DOS_FUNDAMENTOS} />);
    const ataque = linha('Ataque');
    expect(within(ataque).getByText('0%')).toBeInTheDocument();
    expect(ataque).not.toHaveTextContent(/sem dados/i);
    expect(linha('Recepção')).toHaveTextContent('66,7%');
  });

  it('sem rotulos mostra o codigo do fundamento', () => {
    render(<BarrasDesempenho desempenho={SEMANA.desempenho} rotulos={{}} />);
    expect(screen.getByText('preparo_fisico')).toBeInTheDocument();
  });

  it('nao tem violacoes de acessibilidade', async () => {
    const { container } = render(<BarrasDesempenho desempenho={SEMANA.desempenho} rotulos={ROTULOS_DOS_FUNDAMENTOS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
