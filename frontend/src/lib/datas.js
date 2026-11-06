// Datas do VOLLEY PRO no fuso de São Paulo, sem biblioteca: só Intl e aritmética de calendário.
// "Data local" aqui é sempre o texto AAAA-MM-DD (mesmo formato que a API devolve).

export const FUSO = 'America/Sao_Paulo';

export const INICIAIS_DOS_DIAS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export const NOMES_DOS_DIAS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

const MS_POR_DIA = 86_400_000;
const FORMATO_DATA_LOCAL = /^(\d{4})-(\d{2})-(\d{2})$/;

const partesNoFuso = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const diaEMesPorExtenso = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, day: 'numeric', month: 'long' });

function instante(agora) {
  const data = agora instanceof Date ? agora : new Date(typeof agora === 'number' ? agora : Number.NaN);
  if (Number.isNaN(data.getTime())) {
    throw new TypeError('Data inválida: informe um Date ou um carimbo em milissegundos.');
  }
  return data;
}

function parte(partes, tipo) {
  return partes.find((item) => item.type === tipo).value;
}

function doisDigitos(numero) {
  return String(numero).padStart(2, '0');
}

// Converte AAAA-MM-DD em milissegundos UTC da meia-noite daquele dia de calendário.
function paraCalendario(dataLocalEmTexto) {
  const partes = FORMATO_DATA_LOCAL.exec(typeof dataLocalEmTexto === 'string' ? dataLocalEmTexto : '');
  if (!partes) {
    throw new TypeError('Data inválida: use o formato AAAA-MM-DD.');
  }
  const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const ms = Date.UTC(ano, mes - 1, dia);
  const conferida = new Date(ms);
  if (conferida.getUTCMonth() !== mes - 1 || conferida.getUTCDate() !== dia) {
    throw new TypeError('Data inválida: esse dia não existe no calendário.');
  }
  return ms;
}

function deCalendario(ms) {
  const data = new Date(ms);
  return `${data.getUTCFullYear()}-${doisDigitos(data.getUTCMonth() + 1)}-${doisDigitos(data.getUTCDate())}`;
}

/** Data de calendário em São Paulo (AAAA-MM-DD) para um instante. */
export function dataLocal(agora) {
  const partes = partesNoFuso.formatToParts(instante(agora));
  return `${parte(partes, 'year')}-${parte(partes, 'month')}-${parte(partes, 'day')}`;
}

/** Soma (ou subtrai) dias de calendário a uma data local AAAA-MM-DD. */
export function somarDias(data, dias) {
  return deCalendario(paraCalendario(data) + dias * MS_POR_DIA);
}

/** Posição do dia na semana que começa na segunda: 0 = segunda … 6 = domingo. */
export function indiceNaSemana(data) {
  return (new Date(paraCalendario(data)).getUTCDay() + 6) % 7;
}

/**
 * Segunda-feira da semana de uma data qualquer.
 * Aceita um instante (Date ou milissegundos, lido no fuso de São Paulo) ou uma data local AAAA-MM-DD.
 */
export function inicioDaSemana(data) {
  const local = typeof data === 'string' ? data : dataLocal(data);
  return somarDias(local, -indiceNaSemana(local));
}

/**
 * Os 7 dias da semana atual (segunda a domingo) para a frequência semanal.
 * datasTreinadas: datas locais AAAA-MM-DD vindas do servidor (frequencia.datas).
 */
export function diasDaSemana(agora, datasTreinadas = []) {
  const hoje = dataLocal(agora);
  const segunda = inicioDaSemana(hoje);
  const treinadas = new Set(datasTreinadas ?? []);
  return NOMES_DOS_DIAS.map((nome, indice) => {
    const data = somarDias(segunda, indice);
    return { data, inicial: INICIAIS_DOS_DIAS[indice], nome, hoje: data === hoje, treinou: treinadas.has(data) };
  });
}

/** "Hoje, 15 de outubro" (mês em minúscula), no fuso de São Paulo. */
export function formatarHojePorExtenso(agora) {
  const partes = diaEMesPorExtenso.formatToParts(instante(agora));
  return `Hoje, ${parte(partes, 'day')} de ${parte(partes, 'month').toLocaleLowerCase('pt-BR')}`;
}
