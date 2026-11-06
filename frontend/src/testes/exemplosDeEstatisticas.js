// Corpos de exemplo de GET /api/v1/estatisticas e GET /api/v1/referencias, idênticos ao contrato do PR-19.
import { http as rede, HttpResponse } from 'msw';
import { servidor } from './servidor.js';

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

export const ROTULOS_DOS_FUNDAMENTOS = {
  recepcao: 'Recepção',
  levantamento: 'Levantamento',
  ataque: 'Ataque',
  saque: 'Saque',
  bloqueio: 'Bloqueio',
  defesa: 'Defesa',
  preparo_fisico: 'Preparo físico',
};

const semTentativas = (fundamento) => ({ fundamento, acertos: 0, erros: 0, tentativas: 0, percentual: null });

// Exemplo do contrato: "agora" = sexta 06/11/2026, periodo=semana.
export const SEMANA = {
  periodo: 'semana',
  fuso: 'America/Sao_Paulo',
  inicio: '2026-11-02',
  fim: '2026-11-08',
  volume: {
    granularidade: 'dia',
    total_minutos: 105,
    pontos: [
      { inicio: '2026-11-02', minutos: 45 },
      { inicio: '2026-11-03', minutos: 0 },
      { inicio: '2026-11-04', minutos: 60 },
      { inicio: '2026-11-05', minutos: 0 },
      { inicio: '2026-11-06', minutos: 0 },
      { inicio: '2026-11-07', minutos: 0 },
      { inicio: '2026-11-08', minutos: 0 },
    ],
  },
  desempenho: [
    { fundamento: 'recepcao', acertos: 42, erros: 18, tentativas: 60, percentual: 70.0 },
    semTentativas('levantamento'),
    semTentativas('ataque'),
    { fundamento: 'saque', acertos: 15, erros: 5, tentativas: 20, percentual: 75.0 },
    semTentativas('bloqueio'),
    semTentativas('defesa'),
    semTentativas('preparo_fisico'),
  ],
  frequencia: {
    semana_inicio: '2026-11-02',
    semana_fim: '2026-11-08',
    dias_treinados: 2,
    meta: 3,
    datas: ['2026-11-02', '2026-11-04'],
  },
};

export const MES = {
  ...SEMANA,
  periodo: 'mes',
  inicio: '2026-10-12',
  fim: '2026-11-08',
  volume: {
    granularidade: 'semana',
    total_minutos: 290,
    pontos: [
      { inicio: '2026-10-12', minutos: 90 },
      { inicio: '2026-10-19', minutos: 0 },
      { inicio: '2026-10-26', minutos: 95 },
      { inicio: '2026-11-02', minutos: 105 },
    ],
  },
  desempenho: [
    { fundamento: 'recepcao', acertos: 100, erros: 50, tentativas: 150, percentual: 66.7 },
    semTentativas('levantamento'),
    { fundamento: 'ataque', acertos: 0, erros: 4, tentativas: 4, percentual: 0.0 },
    { fundamento: 'saque', acertos: 40, erros: 10, tentativas: 50, percentual: 80.0 },
    semTentativas('bloqueio'),
    semTentativas('defesa'),
    semTentativas('preparo_fisico'),
  ],
};

export const ANO = {
  ...MES,
  periodo: 'ano',
  inicio: '2025-12-01',
  fim: '2026-11-30',
  volume: {
    granularidade: 'mes',
    total_minutos: 1200,
    pontos: [
      { inicio: '2025-12-01', minutos: 100 },
      { inicio: '2026-01-01', minutos: 100 },
      { inicio: '2026-02-01', minutos: 100 },
      { inicio: '2026-03-01', minutos: 100 },
      { inicio: '2026-04-01', minutos: 100 },
      { inicio: '2026-05-01', minutos: 100 },
      { inicio: '2026-06-01', minutos: 100 },
      { inicio: '2026-07-01', minutos: 100 },
      { inicio: '2026-08-01', minutos: 100 },
      { inicio: '2026-09-01', minutos: 100 },
      { inicio: '2026-10-01', minutos: 100 },
      { inicio: '2026-11-01', minutos: 100 },
    ],
  },
};

export const VAZIA = {
  ...SEMANA,
  volume: {
    granularidade: 'dia',
    total_minutos: 0,
    pontos: SEMANA.volume.pontos.map((ponto) => ({ ...ponto, minutos: 0 })),
  },
  desempenho: SEMANA.desempenho.map((item) => semTentativas(item.fundamento)),
  frequencia: { ...SEMANA.frequencia, dias_treinados: 0, datas: [] },
};

export const POR_PERIODO = { semana: SEMANA, mes: MES, '3meses': MES, ano: ANO };

/** Registra GET /referencias no servidor MSW. */
export function registrarReferencias() {
  servidor.use(rede.get('/api/v1/referencias', () => HttpResponse.json({ data: REFERENCIAS })));
}

/**
 * Registra GET /estatisticas devolvendo o exemplo do período pedido (ou `corpoFixo` para todos)
 * e devolve a lista dos parâmetros `periodo` recebidos, na ordem.
 */
export function registrarEstatisticas(corpoFixo) {
  const pedidos = [];
  servidor.use(
    rede.get('/api/v1/estatisticas', ({ request }) => {
      const periodo = new URL(request.url).searchParams.get('periodo');
      pedidos.push(periodo);
      const corpo = corpoFixo ?? POR_PERIODO[periodo];
      if (!corpo) {
        const mensagem = 'Informe um período válido: semana, mes, 3meses ou ano.';
        return HttpResponse.json(
          { message: mensagem, errors: { periodo: [mensagem] }, request_id: 'req-422' },
          { status: 422 },
        );
      }
      return HttpResponse.json({ data: corpo });
    }),
  );
  return pedidos;
}
