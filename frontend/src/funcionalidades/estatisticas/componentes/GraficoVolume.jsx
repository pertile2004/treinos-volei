import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Cartao from '../../../componentes/Cartao.jsx';
import { indiceNaSemana } from '../../../lib/datas.js';
import { formatarMinutos } from '../../../lib/formatos.js';
import { rotuloDoPeriodo } from '../../../lib/tabelas.js';

const ABREVIACOES_DOS_DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const ABREVIACOES_DOS_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Rótulo curto do eixo X: dia "Seg 02/11", semana "12/10", mês "nov/26". */
export function rotuloCurto(inicio, granularidade) {
  const [ano, mes, dia] = inicio.split('-');
  if (granularidade === 'dia') return `${ABREVIACOES_DOS_DIAS[indiceNaSemana(inicio)]} ${dia}/${mes}`;
  if (granularidade === 'mes') return `${ABREVIACOES_DOS_MESES[Number(mes) - 1]}/${ano.slice(2)}`;
  return `${dia}/${mes}`;
}

/** Descrição em texto do gráfico: total do período e balde de maior volume. */
export function resumoDoVolume(volume) {
  const total = `Total no período: ${formatarMinutos(volume.total_minutos)}.`;
  if (!volume.total_minutos) return total;
  const maior = volume.pontos.reduce((melhor, ponto) => (ponto.minutos > melhor.minutos ? ponto : melhor));
  const quando = rotuloDoPeriodo(maior.inicio, volume.granularidade);
  return `${total} Maior volume em ${quando}, com ${formatarMinutos(maior.minutos)}.`;
}

// Cores e fontes só pelos tokens: o Tailwind 4 expõe cada token do @theme como variável CSS.
const COR_LINHA = 'var(--color-primaria)';
const COR_EIXO = 'var(--color-borda-controle)';
const COR_GRADE = 'var(--color-borda)';
const TEXTO_EIXO = { fill: 'var(--color-texto-secundario)', fontSize: 12 };
const ESTILO_DICA = {
  backgroundColor: 'var(--color-superficie-elevada)',
  border: '1px solid var(--color-borda-controle)',
  borderRadius: '0.75rem',
  color: 'var(--color-texto)',
};

/**
 * Cartão "Volume de treino (min)": linha por balde (dia, semana ou mês) e resumo em texto.
 * O desenho fica fora da árvore de acessibilidade: o resumo e a tabela equivalente (TabelaEstatisticas) são o conteúdo acessível.
 */
export default function GraficoVolume({ volume }) {
  const dados = volume.pontos.map((ponto) => ({
    rotulo: rotuloCurto(ponto.inicio, volume.granularidade),
    periodo: rotuloDoPeriodo(ponto.inicio, volume.granularidade),
    minutos: ponto.minutos,
  }));

  return (
    <Cartao como="section" aria-labelledby="volume-titulo">
      <h2 id="volume-titulo" className="text-xl font-bold">
        Volume de treino (min)
      </h2>
      <p className="mt-1 text-sm text-texto-secundario">{resumoDoVolume(volume)}</p>
      <div data-grafico="volume" aria-hidden="true" className="mt-4 h-60">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 240 }}>
          <LineChart data={dados} accessibilityLayer={false} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={COR_GRADE} vertical={false} />
            <XAxis dataKey="rotulo" tick={TEXTO_EIXO} stroke={COR_EIXO} tickLine={false} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} width={36} tick={TEXTO_EIXO} stroke={COR_EIXO} tickLine={false} />
            <Tooltip
              formatter={(valor) => [formatarMinutos(valor), 'Volume']}
              labelFormatter={(rotulo, itens) => itens?.[0]?.payload?.periodo ?? rotulo}
              contentStyle={ESTILO_DICA}
              itemStyle={{ color: 'var(--color-texto)' }}
              labelStyle={{ color: 'var(--color-texto-secundario)' }}
              cursor={{ stroke: COR_EIXO }}
            />
            <Line
              type="monotone"
              dataKey="minutos"
              stroke={COR_LINHA}
              strokeWidth={2}
              dot={{ r: 4, fill: COR_LINHA, stroke: COR_LINHA }}
              activeDot={{ r: 6, fill: COR_LINHA, stroke: 'var(--color-texto)' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Cartao>
  );
}
