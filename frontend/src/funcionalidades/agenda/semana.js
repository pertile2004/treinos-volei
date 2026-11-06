// Semana da agenda (segunda a domingo) sobre datas locais AAAA-MM-DD, sem biblioteca: só Intl e src/lib/datas.js.
import { NOMES_DOS_DIAS, indiceNaSemana, inicioDaSemana, somarDias } from '../../lib/datas.js';

const nomeDoMes = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: 'long' });

function partes(data) {
  const calendario = new Date(`${data}T00:00:00Z`);
  return {
    dia: calendario.getUTCDate(),
    mes: nomeDoMes.format(calendario),
    numeroDoMes: calendario.getUTCMonth() + 1,
    ano: calendario.getUTCFullYear(),
  };
}

function doisDigitos(numero) {
  return String(numero).padStart(2, '0');
}

/** { de, ate }: segunda e domingo da semana da data local informada. */
export function intervaloDaSemana(data) {
  const de = inicioDaSemana(data);
  return { de, ate: somarDias(de, 6) };
}

/** "Semana de 9 a 15 de novembro"; com meses ou anos diferentes, repete o que muda. */
export function rotuloDaSemana(de, ate) {
  const inicio = partes(de);
  const fim = partes(ate);
  if (inicio.ano !== fim.ano) {
    return `Semana de ${inicio.dia} de ${inicio.mes} de ${inicio.ano} a ${fim.dia} de ${fim.mes} de ${fim.ano}`;
  }
  if (inicio.numeroDoMes !== fim.numeroDoMes) {
    return `Semana de ${inicio.dia} de ${inicio.mes} a ${fim.dia} de ${fim.mes}`;
  }
  return `Semana de ${inicio.dia} a ${fim.dia} de ${inicio.mes}`;
}

/** { nome: 'Segunda-feira', curta: '09/11' } para uma data local. */
export function rotuloDoDia(data) {
  const { dia, numeroDoMes } = partes(data);
  return { nome: NOMES_DOS_DIAS[indiceNaSemana(data)], curta: `${doisDigitos(dia)}/${doisDigitos(numeroDoMes)}` };
}

/** Os 7 dias a partir de `de`, cada um com { data, nome, curta, itens } (itens na ordem recebida). */
export function agruparPorDia(agendamentos, de) {
  return Array.from({ length: 7 }, (_, indice) => {
    const data = somarDias(de, indice);
    return { data, ...rotuloDoDia(data), itens: agendamentos.filter((agendamento) => agendamento.data === data) };
  });
}
