// Respostas da API usadas nos testes da tela Criar treino (mesmos corpos do contrato do PR-12,
// do GET /referencias do PR-01 e do GET /exercicios do PR-08). Só para testes.
import { delay, http as rede, HttpResponse } from 'msw';
import { servidor } from '../../testes/servidor.js';

export const REFERENCIAS = {
  papeis: [
    { valor: 'jogador', rotulo: 'Jogador' },
    { valor: 'treinador', rotulo: 'Treinador' },
    { valor: 'admin', rotulo: 'Administrador' },
  ],
  fundamentos: [
    { valor: 'recepcao', rotulo: 'Recepção' },
    { valor: 'levantamento', rotulo: 'Levantamento' },
    { valor: 'ataque', rotulo: 'Ataque' },
    { valor: 'saque', rotulo: 'Saque' },
    { valor: 'bloqueio', rotulo: 'Bloqueio' },
    { valor: 'defesa', rotulo: 'Defesa' },
    { valor: 'preparo_fisico', rotulo: 'Preparo físico' },
  ],
  niveis: [
    { valor: 'iniciante', rotulo: 'Iniciante' },
    { valor: 'intermediario', rotulo: 'Intermediário' },
    { valor: 'avancado', rotulo: 'Avançado' },
  ],
  etapas: [
    { valor: 'aquecimento', rotulo: 'Aquecimento' },
    { valor: 'tecnica', rotulo: 'Técnica' },
    { valor: 'especifico', rotulo: 'Específico' },
    { valor: 'volta_a_calma', rotulo: 'Volta à calma' },
  ],
  visibilidades: [
    { valor: 'privado', rotulo: 'Privado' },
    { valor: 'atletas', rotulo: 'Atletas' },
    { valor: 'publico', rotulo: 'Público' },
  ],
  origens_sessao: [
    { valor: 'cronometro', rotulo: 'Cronômetro' },
    { valor: 'registro_rapido', rotulo: 'Registro rápido' },
  ],
};

export const MANCHETE = {
  id: 15,
  nome: 'Recepção em manchete',
  foco: 'Plataforma firme',
  fundamento: 'recepcao',
  fundamento_rotulo: 'Recepção',
  nivel: 'iniciante',
  nivel_rotulo: 'Iniciante',
  series_padrao: 3,
  repeticoes_padrao: 10,
  duracao_segundos_padrao: null,
  descanso_segundos: 45,
  tem_video: false,
  imagem_url: null,
};

export const DESLOCAMENTO = {
  id: 7,
  nome: 'Deslocamento lateral',
  foco: 'Agilidade',
  fundamento: 'preparo_fisico',
  fundamento_rotulo: 'Preparo físico',
  nivel: 'iniciante',
  nivel_rotulo: 'Iniciante',
  series_padrao: 2,
  repeticoes_padrao: null,
  duracao_segundos_padrao: 60,
  descanso_segundos: 30,
  tem_video: true,
  imagem_url: null,
};

export const SAQUE = {
  id: 21,
  nome: 'Saque por baixo',
  foco: 'Contato firme',
  fundamento: 'saque',
  fundamento_rotulo: 'Saque',
  nivel: 'intermediario',
  nivel_rotulo: 'Intermediário',
  series_padrao: 10,
  repeticoes_padrao: 100,
  duracao_segundos_padrao: null,
  descanso_segundos: 600,
  tem_video: false,
  imagem_url: null,
};

export const EXERCICIOS = [MANCHETE, DESLOCAMENTO, SAQUE];

export function registrarReferencias() {
  servidor.use(rede.get('/api/v1/referencias', () => HttpResponse.json({ data: REFERENCIAS })));
}

/** GET /exercicios com filtros de verdade sobre a lista fixa; devolve os parâmetros de cada pedido. */
export function registrarExercicios(lista = EXERCICIOS, { porPagina = 15, espera = 0 } = {}) {
  const pedidos = [];
  servidor.use(
    rede.get('/api/v1/exercicios', async ({ request }) => {
      const parametros = Object.fromEntries(new URL(request.url).searchParams);
      pedidos.push(parametros);
      if (espera > 0) await delay(espera);
      const filtrados = lista.filter(
        (exercicio) =>
          (!parametros.fundamento || exercicio.fundamento === parametros.fundamento) &&
          (!parametros.nivel || exercicio.nivel === parametros.nivel) &&
          (!parametros.busca || exercicio.nome.toLowerCase().includes(parametros.busca.toLowerCase())),
      );
      const pagina = Number(parametros.page ?? 1);
      const inicio = (pagina - 1) * porPagina;
      return HttpResponse.json({
        data: filtrados.slice(inicio, inicio + porPagina),
        links: {},
        meta: {
          current_page: pagina,
          per_page: porPagina,
          total: filtrados.length,
          last_page: Math.max(1, Math.ceil(filtrados.length / porPagina)),
        },
      });
    }),
  );
  return pedidos;
}

/** Resposta 201 do contrato, montada a partir do corpo recebido. */
export function treinoCriado(corpo, id = 12) {
  const porId = new Map(EXERCICIOS.map((exercicio) => [exercicio.id, exercicio]));
  return {
    id,
    nome: corpo.nome,
    descricao: corpo.descricao,
    nivel: corpo.nivel,
    visibilidade: corpo.visibilidade,
    duracao_estimada_minutos: 9,
    autor: { id: 3, nome: 'Lucas' },
    itens: corpo.itens.map((item, indice) => {
      const exercicio = porId.get(item.exercicio_id);
      return {
        id: 40 + indice,
        etapa: item.etapa,
        ordem: item.ordem,
        series: item.series,
        repeticoes: item.repeticoes,
        duracao_segundos: item.duracao_segundos,
        descanso_segundos: item.descanso_segundos,
        exercicio: {
          id: item.exercicio_id,
          nome: exercicio?.nome ?? 'Exercício',
          fundamento: exercicio?.fundamento ?? null,
          removido: false,
        },
      };
    }),
    criado_em: '2026-11-06T14:00:00Z',
  };
}

/** POST /treinos respondendo 201 com o contrato; devolve os corpos recebidos. */
export function registrarCriarTreino() {
  const corpos = [];
  servidor.use(
    rede.post('/api/v1/treinos', async ({ request }) => {
      const corpo = await request.json();
      corpos.push(corpo);
      return HttpResponse.json({ data: treinoCriado(corpo) }, { status: 201 });
    }),
  );
  return corpos;
}

/** POST /treinos respondendo com um erro fixo. */
export function registrarErroAoCriar(status, corpo) {
  servidor.use(rede.post('/api/v1/treinos', () => HttpResponse.json(corpo, { status })));
}
