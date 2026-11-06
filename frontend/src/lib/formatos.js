// Formatação de textos curtos da interface: nome, duração e percentual de acerto.

export const SEM_DADOS = 'sem dados';

const numeroComUmaCasa = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function palavras(nome) {
  return typeof nome === 'string' ? nome.trim().split(/\s+/).filter(Boolean) : [];
}

function primeiraLetra(palavra) {
  return Array.from(palavra)[0].toLocaleUpperCase('pt-BR');
}

function doisDigitos(numero) {
  return String(numero).padStart(2, '0');
}

// Quantidade não negativa; ausente, negativa ou inválida vira 0.
function quantidade(valor) {
  const numero = Number(valor ?? 0);
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}

/** Primeira palavra do nome, como foi digitada. Sem nome devolve ''. */
export function primeiroNome(nome) {
  return palavras(nome)[0] ?? '';
}

/** "Fala, Guto!". Sem nome devolve "Fala!". */
export function saudacao(nome) {
  const primeiro = primeiroNome(nome);
  return primeiro ? `Fala, ${primeiro}!` : 'Fala!';
}

/** Iniciais para o avatar: primeira letra do primeiro e do último nome, em maiúscula (até 2 letras). */
export function iniciais(nome) {
  const partes = palavras(nome);
  if (partes.length === 0) return '';
  if (partes.length === 1) return primeiraLetra(partes[0]);
  return primeiraLetra(partes[0]) + primeiraLetra(partes[partes.length - 1]);
}

/** Minutos em texto: "45 min", "1 h 05 min", "2 h". */
export function formatarMinutos(minutos) {
  const total = Math.round(quantidade(minutos));
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${doisDigitos(resto)} min`;
}

/** Duração em segundos (duracao_segundos) arredondada para minutos, como o servidor faz. */
export function formatarDuracao(segundos) {
  return formatarMinutos(Math.round(quantidade(segundos) / 60));
}

/** Relógio do cronômetro: "01:05"; a partir de 1 hora, "1:15:30". */
export function formatarCronometro(segundos) {
  const total = Math.floor(quantidade(segundos));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const relogio = `${doisDigitos(minutos)}:${doisDigitos(total % 60)}`;
  return horas > 0 ? `${horas}:${relogio}` : relogio;
}

/** Percentual já calculado (campo "percentual" da API): 70 → "70%", 66.7 → "66,7%", null → "sem dados". */
export function formatarPercentual(percentual) {
  if (typeof percentual !== 'number' || !Number.isFinite(percentual)) return SEM_DADOS;
  return `${numeroComUmaCasa.format(percentual)}%`;
}

/** % de acerto a partir de acertos e erros. Sem tentativas devolve "sem dados", nunca "0%". */
export function formatarPercentualDeAcerto(acertos, erros) {
  const [certos, errados] = [Number(acertos ?? 0), Number(erros ?? 0)];
  const validos = [certos, errados].every((valor) => Number.isFinite(valor) && valor >= 0);
  const tentativas = certos + errados;
  if (!validos || tentativas === 0) return SEM_DADOS;
  return formatarPercentual(Math.round((certos / tentativas) * 1000) / 10);
}
