import { useId, useState } from 'react';
import { useLocation } from 'react-router';
import Abas, { PainelDaAba } from '../../../componentes/Abas.jsx';
import BarraLateral from '../../../componentes/BarraLateral.jsx';
import Botao from '../../../componentes/Botao.jsx';
import Cabecalho from '../../../componentes/Cabecalho.jsx';
import NavInferior from '../../../componentes/NavInferior.jsx';

// Conteúdo de demonstração do catálogo /dev/componentes (não é dado de API).
const PERIODOS = [
  { id: 'semana', rotulo: 'Semana' },
  { id: 'mes', rotulo: 'Mês' },
  { id: 'tres-meses', rotulo: '3 Meses' },
  { id: 'ano', rotulo: 'Ano' },
];

function Icone({ children }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function Componente({ nome, children }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-bold">{nome}</h3>
      {children}
    </div>
  );
}

function Legenda({ children }) {
  return <p className="text-sm text-texto-secundario">{children}</p>;
}

/** Seção "Navegação" do catálogo /dev/componentes: Abas, Cabecalho, NavInferior e BarraLateral em todos os estados. */
export default function SecaoNavegacao() {
  const idDoTitulo = useId();
  const { pathname } = useLocation();
  const [periodo, setPeriodo] = useState('semana');
  const [ultimaAcao, setUltimaAcao] = useState('nenhuma');

  // "Início" aponta para a rota do próprio catálogo: mostra o item atual sem tirar a pessoa da página.
  const itens = [
    {
      para: pathname,
      rotulo: 'Início',
      exato: true,
      icone: (
        <Icone>
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </Icone>
      ),
    },
    {
      para: '/biblioteca',
      rotulo: 'Biblioteca',
      icone: (
        <Icone>
          <path d="M5 4h14v16H5z" />
          <path d="M9 4v16" />
        </Icone>
      ),
    },
    {
      para: '/treino',
      rotulo: 'Treino',
      icone: (
        <Icone>
          <path d="M6 8v8" />
          <path d="M3 10v4" />
          <path d="M18 8v8" />
          <path d="M21 10v4" />
          <path d="M6 12h12" />
        </Icone>
      ),
    },
    {
      para: '/evolucao',
      rotulo: 'Evolução',
      icone: (
        <Icone>
          <path d="M4 4v16h16" />
          <path d="M8 16v-4" />
          <path d="M12 16V8" />
          <path d="M16 16v-6" />
        </Icone>
      ),
    },
  ];

  return (
    <section aria-labelledby={idDoTitulo} className="flex flex-col gap-8 py-6">
      <h2 id={idDoTitulo} className="text-2xl font-bold">
        Navegação
      </h2>

      <Componente nome="Abas">
        <Legenda>Aba ativa e inativas. No teclado: Tab entra na aba ativa; setas, Home e End trocam de aba.</Legenda>
        <Abas itens={PERIODOS} ativa={periodo} aoMudar={setPeriodo} rotuloDoGrupo="Período" />
        {PERIODOS.map((item) => (
          <PainelDaAba key={item.id} id={item.id} ativa={periodo} className="rounded-cartao bg-superficie p-4">
            Volume de treino (min) — período: {item.rotulo}
          </PainelDaAba>
        ))}
      </Componente>

      <Componente nome="Cabecalho">
        <Legenda>
          Só o título; com subtítulo; com voltar por link; com voltar por botão e ações. Aqui o título usa h4; nas telas
          é o h1.
        </Legenda>
        <Cabecalho nivelDoTitulo={4} titulo="Biblioteca" className="rounded-cartao bg-superficie" />
        <Cabecalho
          nivelDoTitulo={4}
          titulo="Início"
          subtitulo="Hoje, 15 de outubro"
          className="rounded-cartao bg-superficie"
        />
        <Cabecalho
          nivelDoTitulo={4}
          titulo="Novo treino"
          voltarPara={pathname}
          className="rounded-cartao bg-superficie"
        />
        <Cabecalho
          nivelDoTitulo={4}
          titulo="Treino de saque"
          subtitulo="Voltar por botão e duas ações"
          aoVoltar={() => setUltimaAcao('Voltar')}
          acoes={
            <>
              <Botao variante="secundario" tamanho="sm" onClick={() => setUltimaAcao('Editar')}>
                Editar
              </Botao>
              <Botao variante="secundario" tamanho="sm" onClick={() => setUltimaAcao('Duplicar')}>
                Duplicar
              </Botao>
            </>
          }
          className="rounded-cartao bg-superficie"
        />
        <p role="status" className="text-sm text-texto-secundario">
          Última ação acionada: {ultimaAcao}
        </p>
      </Componente>

      <Componente nome="NavInferior">
        <Legenda>
          Item atual (Início) e inativos. No aplicativo fica fixa embaixo e só aparece abaixo de 1024 px.
        </Legenda>
        <NavInferior itens={itens} aria-label="Exemplo de navegação inferior" className="static" />
      </Componente>

      <Componente nome="BarraLateral">
        <Legenda>Item atual (Início) e inativos, com rodapé. No aplicativo só aparece a partir de 1024 px.</Legenda>
        <BarraLateral
          itens={itens}
          aria-label="Exemplo de barra lateral"
          className="min-h-80 max-w-64"
          rodape={<p className="px-3 text-sm text-texto-secundario">Rodapé de exemplo</p>}
        />
      </Componente>
    </section>
  );
}
