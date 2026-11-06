import Cartao from '../../../componentes/Cartao.jsx';
import { linhasDeDesempenho, linhasDeVolume } from '../../../lib/tabelas.js';

const CABECALHO = 'py-2 text-sm font-bold text-texto-secundario';
const CELULA = 'py-2 tabular-nums';

/** Tabelas equivalentes aos gráficos: volume (Período, Minutos) e performance (Fundamento, Acertos, Erros, % de acerto). */
export default function TabelaEstatisticas({ estatisticas, rotulos = {} }) {
  const volume = linhasDeVolume(estatisticas);
  const desempenho = linhasDeDesempenho(estatisticas, rotulos);

  return (
    <>
      <Cartao como="section">
        <table className="w-full text-left">
          <caption className="mb-2 text-left text-xl font-bold text-texto">Volume de treino (min)</caption>
          <thead>
            <tr>
              <th scope="col" className={CABECALHO}>
                Período
              </th>
              <th scope="col" className={`${CABECALHO} text-right`}>
                Minutos
              </th>
            </tr>
          </thead>
          <tbody>
            {volume.map((linha) => (
              <tr key={linha.chave} className="border-t border-borda">
                <th scope="row" className={`${CELULA} font-normal`}>
                  {linha.periodo}
                </th>
                <td className={`${CELULA} text-right`}>{linha.minutos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Cartao>

      <Cartao como="section">
        <table className="w-full text-left">
          <caption className="mb-2 text-left text-xl font-bold text-texto">Performance por fundamento</caption>
          <thead>
            <tr>
              <th scope="col" className={CABECALHO}>
                Fundamento
              </th>
              <th scope="col" className={`${CABECALHO} text-right`}>
                Acertos
              </th>
              <th scope="col" className={`${CABECALHO} text-right`}>
                Erros
              </th>
              <th scope="col" className={`${CABECALHO} text-right`}>
                % de acerto
              </th>
            </tr>
          </thead>
          <tbody>
            {desempenho.map((linha) => (
              <tr key={linha.chave} className="border-t border-borda">
                <th scope="row" className={`${CELULA} font-normal`}>
                  {linha.fundamento}
                </th>
                <td className={`${CELULA} text-right`}>{linha.acertos}</td>
                <td className={`${CELULA} text-right`}>{linha.erros}</td>
                <td className={`${CELULA} text-right`}>{linha.percentual}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Cartao>
    </>
  );
}
