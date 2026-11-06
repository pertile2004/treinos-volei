/** Barra de progresso. `valor` nulo significa "Sem dados" e nunca aparece como 0% (RN-02). */
export default function BarraDeProgresso({ rotulo, valor, max = 100, mostrarTexto = true, className = '', ...resto }) {
  const semDados = typeof valor !== 'number' || Number.isNaN(valor);
  const maximo = max > 0 ? max : 100;
  const atual = semDados ? undefined : Math.min(Math.max(valor, 0), maximo);
  const percentual = semDados ? undefined : Math.round((atual / maximo) * 100);
  const textoDoValor = semDados ? 'Sem dados' : `${percentual}%`;

  return (
    <div
      role="progressbar"
      aria-label={rotulo}
      aria-valuemin={0}
      aria-valuemax={maximo}
      aria-valuenow={atual}
      aria-valuetext={textoDoValor}
      className={`flex flex-col gap-1 ${className}`}
      {...resto}
    >
      {(mostrarTexto || semDados) && (
        <div className="flex items-baseline justify-between gap-2 text-sm">
          {mostrarTexto && <span className="text-texto">{rotulo}</span>}
          <span className="ml-auto text-texto-secundario tabular-nums">{textoDoValor}</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-borda">
        {!semDados && (
          <div data-preenchimento="" className="h-full rounded-full bg-primaria" style={{ width: `${percentual}%` }} />
        )}
      </div>
    </div>
  );
}
