const formatoDoValor = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 6 });

// O contorno usa borda-controle: a borda comum não chega a 3:1 sobre os fundos (WCAG 1.4.11).
const classeDoBotao =
  'flex min-h-11 min-w-11 items-center justify-center rounded-botao border border-borda-controle bg-superficie-elevada text-2xl font-bold text-texto hover:border-texto active:bg-superficie disabled:cursor-not-allowed disabled:text-texto-secundario disabled:opacity-50';

function casasDecimais(numero) {
  return (String(numero).split('.')[1] ?? '').length;
}

/** Soma sem o erro de ponto flutuante (0.2 + 0.1 = 0.3), usando as casas do valor e do passo. */
function somar(valor, delta) {
  const casas = Math.min(10, Math.max(casasDecimais(valor), casasDecimais(delta)));
  return Number((valor + delta).toFixed(casas));
}

/** Campo numérico de menos e mais (repetições, séries, carga). O valor fica com quem usa. */
export default function Stepper({
  rotulo,
  valor,
  aoMudar,
  min = 0,
  max,
  passo = 1,
  disabled = false,
  className = '',
  ...resto
}) {
  const temMax = typeof max === 'number';
  const noMinimo = valor <= min;
  const noMaximo = temMax && valor >= max;

  function mudar(delta) {
    let proximo = Math.max(min, somar(valor, delta));
    if (temMax) proximo = Math.min(max, proximo);
    if (proximo !== valor) aoMudar?.(proximo);
  }

  return (
    <div role="group" aria-label={rotulo} className={`inline-flex items-center gap-3 ${className}`} {...resto}>
      <button
        type="button"
        aria-label={`Diminuir ${rotulo}`}
        disabled={disabled || noMinimo}
        onClick={() => mudar(-passo)}
        className={classeDoBotao}
      >
        <span aria-hidden="true">−</span>
      </button>
      <output
        aria-live="polite"
        aria-atomic="true"
        className={`min-w-12 text-center text-2xl font-bold tabular-nums ${disabled ? 'text-texto-secundario' : 'text-texto'}`}
      >
        {formatoDoValor.format(valor)}
      </output>
      <button
        type="button"
        aria-label={`Aumentar ${rotulo}`}
        disabled={disabled || noMaximo}
        onClick={() => mudar(passo)}
        className={classeDoBotao}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
