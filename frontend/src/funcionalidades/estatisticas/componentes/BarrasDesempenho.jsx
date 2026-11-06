import BarraDeProgresso from '../../../componentes/BarraDeProgresso.jsx';
import Cartao from '../../../componentes/Cartao.jsx';
import { formatarPercentual } from '../../../lib/formatos.js';

/**
 * Cartão "Performance por fundamento": uma barra por fundamento, na ordem do servidor.
 * `percentual` null (sem tentativas) vira "Sem dados" na barra, nunca 0% (RN-02); 0% só quando há tentativas e nenhum acerto.
 * `rotulos`: mapa código → nome vindo de GET /referencias; sem rótulo, mostra o código.
 */
export default function BarrasDesempenho({ desempenho, rotulos = {} }) {
  return (
    <Cartao como="section" aria-labelledby="desempenho-titulo">
      <h2 id="desempenho-titulo" className="text-xl font-bold">
        Performance por fundamento
      </h2>
      <ul className="mt-4 flex flex-col gap-3">
        {desempenho.map((item) => {
          const nome = rotulos?.[item.fundamento] ?? item.fundamento;
          const temDados = typeof item.percentual === 'number';
          return (
            <li key={item.fundamento} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-texto">{nome}</span>
                {temDados && (
                  <span className="text-texto-secundario tabular-nums">{formatarPercentual(item.percentual)}</span>
                )}
              </div>
              <BarraDeProgresso
                rotulo={`Acerto em ${nome}`}
                valor={temDados ? item.percentual : null}
                mostrarTexto={false}
              />
            </li>
          );
        })}
      </ul>
    </Cartao>
  );
}
