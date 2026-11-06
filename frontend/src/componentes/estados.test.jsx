import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Carregando from './Carregando.jsx';
import EstadoVazio from './EstadoVazio.jsx';
import MensagemDeErro from './MensagemDeErro.jsx';
import Pagina from './Pagina.jsx';

describe('Pagina', () => {
  it('mostra o titulo em h1, o conteudo e define o titulo do documento', () => {
    render(
      <Pagina titulo="Biblioteca">
        <p>Conteúdo</p>
      </Pagina>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Biblioteca' })).toBeInTheDocument();
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
    expect(document.title).toBe('Biblioteca · VOLLEY PRO');
  });
});

describe('Carregando', () => {
  it('anuncia o carregamento com role status e o rotulo padrao', () => {
    render(<Carregando />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
  });

  it('aceita outro rotulo', () => {
    render(<Carregando rotulo="Salvando o treino…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Salvando o treino…');
  });
});

describe('EstadoVazio', () => {
  it('mostra o titulo, a descricao e a acao', () => {
    render(
      <EstadoVazio titulo="Nenhum treino ainda" descricao="Crie o primeiro treino para começar.">
        <a href="/treinos/novo">Criar treino</a>
      </EstadoVazio>,
    );
    expect(screen.getByRole('heading', { name: 'Nenhum treino ainda' })).toBeInTheDocument();
    expect(screen.getByText('Crie o primeiro treino para começar.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar treino' })).toBeInTheDocument();
  });

  it('funciona só com o titulo', () => {
    const { container } = render(<EstadoVazio titulo="Nada por aqui" />);
    expect(screen.getByRole('heading', { name: 'Nada por aqui' })).toBeInTheDocument();
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });
});

describe('MensagemDeErro', () => {
  const erroDaApi = {
    response: { status: 503, data: { message: 'Banco de dados indisponível.', request_id: 'abc-123' }, headers: {} },
  };

  it('mostra a mensagem da API e o codigo do erro em um alerta', () => {
    render(<MensagemDeErro erro={erroDaApi} />);
    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('Banco de dados indisponível.');
    expect(alerta).toHaveTextContent('Código do erro: abc-123');
    expect(within(alerta).queryByRole('button')).not.toBeInTheDocument();
  });

  it('a mensagem passada pela tela tem prioridade', () => {
    render(<MensagemDeErro erro={erroDaApi} mensagem="Não foi possível carregar os treinos." />);
    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('Não foi possível carregar os treinos.');
    expect(alerta).not.toHaveTextContent('Banco de dados indisponível.');
    expect(alerta).toHaveTextContent('Código do erro: abc-123');
  });

  it('sem request_id não mostra o codigo do erro', () => {
    render(<MensagemDeErro erro={{ response: { status: 500, data: {}, headers: {} } }} />);
    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('Algo deu errado. Tente de novo em instantes.');
    expect(alerta).not.toHaveTextContent('Código do erro');
  });

  it('o botao Tentar de novo chama aoTentarDeNovo', async () => {
    const aoTentarDeNovo = vi.fn();
    render(<MensagemDeErro erro={erroDaApi} aoTentarDeNovo={aoTentarDeNovo} />);
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(aoTentarDeNovo).toHaveBeenCalledTimes(1);
  });
});
