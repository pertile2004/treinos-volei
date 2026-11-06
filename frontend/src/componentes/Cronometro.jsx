const classesPorTamanho = {
  grande: 'text-cronometro',
  medio: 'text-2xl',
};

function segundosInteiros(segundos) {
  const inteiro = Math.floor(Number(segundos));
  return Number.isFinite(inteiro) && inteiro > 0 ? inteiro : 0;
}

function doisDigitos(numero) {
  return String(numero).padStart(2, '0');
}

/** mm:ss; a partir de 1 hora, h:mm:ss. */
function formatarRelogio(total) {
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;
  const fim = `${doisDigitos(minutos)}:${doisDigitos(segundos)}`;
  return horas > 0 ? `${horas}:${fim}` : fim;
}

/** Texto do anúncio: só muda quando o minuto muda. */
function descreverMinutos(total) {
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  if (horas === 0 && minutos === 0) return 'menos de 1 minuto';
  const partes = [];
  if (horas > 0) partes.push(horas === 1 ? '1 hora' : `${horas} horas`);
  if (minutos > 0) partes.push(minutos === 1 ? '1 minuto' : `${minutos} minutos`);
  return partes.join(' e ');
}

/**
 * Mostra o tempo recebido em segundos. Apresentação pura: a contagem (o relógio) fica em quem usa.
 * O relógio visível não é anunciado; uma região educada à parte anuncia só quando o minuto muda.
 */
export default function Cronometro({ segundos, rotulo, tamanho = 'grande', className = '', ...resto }) {
  const total = segundosInteiros(segundos);
  const classeDoTamanho = classesPorTamanho[tamanho] ?? classesPorTamanho.grande;

  return (
    <div className={`inline-flex flex-col items-center ${className}`} {...resto}>
      <span
        role="timer"
        aria-label={rotulo}
        aria-live="off"
        className={`leading-none font-bold text-texto tabular-nums ${classeDoTamanho}`}
      >
        {formatarRelogio(total)}
      </span>
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {`${rotulo}: ${descreverMinutos(total)}`}
      </span>
    </div>
  );
}
