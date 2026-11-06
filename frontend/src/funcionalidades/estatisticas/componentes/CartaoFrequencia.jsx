import BarraDeProgresso from '../../../componentes/BarraDeProgresso.jsx';
import Cartao from '../../../componentes/Cartao.jsx';

/** Cartão "Frequência": dias distintos com sessão na semana atual contra a meta semanal (RN-04). Zero aqui é dado real. */
export default function CartaoFrequencia({ frequencia }) {
  const { dias_treinados: dias, meta } = frequencia;
  return (
    <Cartao como="section" aria-labelledby="frequencia-titulo">
      <h2 id="frequencia-titulo" className="text-xl font-bold">
        Frequência
      </h2>
      <p className="mt-1 text-destaque font-bold tabular-nums">{`${dias} de ${meta} dias nesta semana`}</p>
      <BarraDeProgresso
        className="mt-3"
        rotulo="Dias treinados nesta semana"
        valor={dias}
        max={meta}
        mostrarTexto={false}
      />
    </Cartao>
  );
}
