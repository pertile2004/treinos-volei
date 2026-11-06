import { useId, useState } from 'react';
import Botao from '../../../componentes/Botao.jsx';
import CampoTexto from '../../../componentes/CampoTexto.jsx';
import Cartao from '../../../componentes/Cartao.jsx';
import ChipFiltro from '../../../componentes/ChipFiltro.jsx';
import Etiqueta from '../../../componentes/Etiqueta.jsx';

const VARIANTES = [
  { variante: 'primario', nome: 'Primário' },
  { variante: 'secundario', nome: 'Secundário' },
  { variante: 'fantasma', nome: 'Fantasma' },
  { variante: 'perigo', nome: 'Perigo' },
];

const FUNDAMENTOS = [
  ['recepcao', 'Recepção'],
  ['levantamento', 'Levantamento'],
  ['ataque', 'Ataque'],
  ['saque', 'Saque'],
  ['bloqueio', 'Bloqueio'],
  ['defesa', 'Defesa'],
  ['preparo_fisico', 'Preparo físico'],
];

const ETAPAS = [
  ['aquecimento', 'Aquecimento'],
  ['tecnica', 'Técnica'],
  ['especifico', 'Específico'],
  ['volta_a_calma', 'Volta à calma'],
];

function IconeMais() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="size-5"
    >
      <path d="M12 5v14M5 12h14" />
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

function Grupo({ titulo, children }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-bold text-texto-secundario">{titulo}</h4>
      {children}
    </div>
  );
}

/** Seção "Base" do catálogo /dev/componentes: Botao, CampoTexto, Cartao, ChipFiltro e Etiqueta em todos os estados. */
export default function SecaoBase() {
  const idDoTitulo = useId();
  const [cliques, setCliques] = useState(0);
  const [filtros, setFiltros] = useState(['saque']);
  const contar = () => setCliques((total) => total + 1);

  function alternarFiltro(valor, selecionado) {
    setFiltros((atuais) => (selecionado ? [...atuais, valor] : atuais.filter((atual) => atual !== valor)));
  }

  return (
    <section aria-labelledby={idDoTitulo} className="flex flex-col gap-8 py-6">
      <h2 id={idDoTitulo} className="text-2xl font-bold">
        Base
      </h2>

      <Componente nome="Botao">
        <p className="text-sm text-texto-secundario">
          Passe o mouse, pressione e navegue com Tab para ver os estados de hover, pressionado e foco.
        </p>
        <p role="status" className="text-sm text-texto-secundario">
          Cliques nos botões de exemplo: {cliques}
        </p>

        {VARIANTES.map(({ variante, nome }) => (
          <Grupo key={variante} titulo={`Variação ${variante}`}>
            <div className="flex flex-wrap items-center gap-3">
              <Botao variante={variante} onClick={contar}>
                {nome}
              </Botao>
              <Botao variante={variante} tamanho="sm" onClick={contar}>
                {nome} pequeno
              </Botao>
              <Botao variante={variante} disabled onClick={contar}>
                {nome} desabilitado
              </Botao>
              <Botao variante={variante} carregando onClick={contar}>
                {nome} carregando
              </Botao>
            </div>
          </Grupo>
        ))}

        <Grupo titulo="Com ícone, só ícone, link e largura total">
          <div className="flex flex-wrap items-center gap-3">
            <Botao icone={<IconeMais />} onClick={contar}>
              Novo treino
            </Botao>
            <Botao variante="secundario" icone={<IconeMais />} aria-label="Adicionar exercício" onClick={contar} />
            <Botao variante="fantasma" para="/cadastro">
              Cadastre-se
            </Botao>
          </div>
          <Botao larguraTotal onClick={contar}>
            Largura total
          </Botao>
        </Grupo>
      </Componente>

      <Componente nome="CampoTexto">
        <div className="flex max-w-md flex-col gap-4">
          <CampoTexto rotulo="Seu nome" nome="nome" obrigatorio autoComplete="name" />
          <CampoTexto
            rotulo="E-mail"
            nome="email"
            tipo="email"
            autoComplete="email"
            defaultValue="ana@exemplo"
            erro="Informe um e-mail válido."
          />
          <CampoTexto
            rotulo="Senha"
            nome="senha"
            tipo="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            ajuda="Use pelo menos 8 caracteres. Você pode colar a senha."
          />
          <CampoTexto rotulo="Duração do treino (min)" nome="duracao" tipo="number" min={1} inputMode="numeric" />
          <CampoTexto rotulo="Buscar exercício" nome="busca" tipo="search" placeholder="Saque, recepção…" />
          <CampoTexto rotulo="Campo desabilitado" nome="desabilitado" defaultValue="Não editável" disabled />
          <CampoTexto rotulo="Senha desabilitada" nome="senha-desabilitada" tipo="password" disabled />
        </div>
      </Componente>

      <Componente nome="Cartao">
        <Grupo titulo="Plano e elevado">
          <div className="grid gap-3 sm:grid-cols-2">
            <Cartao>
              <p className="font-bold">Plano</p>
              <p className="text-sm text-texto-secundario">Volume de treino (min)</p>
            </Cartao>
            <Cartao elevado>
              <p className="font-bold">Elevado</p>
              <p className="text-sm text-texto-secundario">Hoje, 15 de outubro</p>
            </Cartao>
          </div>
        </Grupo>

        <Grupo titulo="Em lista (li), com cartões clicáveis">
          <ul className="grid gap-3 sm:grid-cols-2">
            <Cartao como="li">
              <p className="font-bold">Treino de recepção</p>
              <p className="text-sm text-texto-secundario">15 min · não clicável</p>
            </Cartao>
            <Cartao como="li" para="/biblioteca">
              <p className="font-bold">Treino de saque</p>
              <p className="text-sm text-texto-secundario">20 min · o cartão inteiro é um link</p>
            </Cartao>
            <Cartao como="li" elevado para="/biblioteca">
              <p className="font-bold">Treino de ataque</p>
              <p className="text-sm text-texto-secundario">25 min · elevado e clicável</p>
            </Cartao>
          </ul>
        </Grupo>

        <Grupo titulo="Como article e section">
          <div className="grid gap-3 sm:grid-cols-2">
            <Cartao como="article">
              <p className="font-bold">Article</p>
              <p className="text-sm text-texto-secundario">Conteúdo independente.</p>
            </Cartao>
            <Cartao como="section" aria-label="Resumo da semana">
              <p className="font-bold">Section</p>
              <p className="text-sm text-texto-secundario">Região com nome próprio.</p>
            </Cartao>
          </div>
        </Grupo>
      </Componente>

      <Componente nome="ChipFiltro">
        <Grupo titulo="Filtro por fundamento (clique para alternar)">
          <div className="flex flex-wrap gap-2">
            {FUNDAMENTOS.map(([valor, rotulo]) => (
              <ChipFiltro
                key={valor}
                selecionado={filtros.includes(valor)}
                aoAlternar={(selecionado) => alternarFiltro(valor, selecionado)}
              >
                {rotulo}
              </ChipFiltro>
            ))}
          </div>
        </Grupo>
        <Grupo titulo="Desabilitado, não selecionado e selecionado">
          <div className="flex flex-wrap gap-2">
            <ChipFiltro disabled>Iniciante</ChipFiltro>
            <ChipFiltro disabled selecionado>
              Avançado
            </ChipFiltro>
          </div>
        </Grupo>
      </Componente>

      <Componente nome="Etiqueta">
        <Grupo titulo="Fundamento">
          <div className="flex flex-wrap gap-2">
            {FUNDAMENTOS.map(([valor, rotulo]) => (
              <Etiqueta key={valor} tipo="fundamento" valor={valor}>
                {rotulo}
              </Etiqueta>
            ))}
          </div>
        </Grupo>
        <Grupo titulo="Etapa">
          <div className="flex flex-wrap gap-2">
            {ETAPAS.map(([valor, rotulo]) => (
              <Etiqueta key={valor} tipo="etapa" valor={valor}>
                {rotulo}
              </Etiqueta>
            ))}
          </div>
        </Grupo>
        <Grupo titulo="Neutra">
          <div className="flex flex-wrap gap-2">
            <Etiqueta>Em destaque</Etiqueta>
          </div>
        </Grupo>
      </Componente>
    </section>
  );
}
