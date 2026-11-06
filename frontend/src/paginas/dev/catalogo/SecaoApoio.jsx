import { useId, useState } from 'react';
import Avatar from '../../../componentes/Avatar.jsx';
import Botao from '../../../componentes/Botao.jsx';
import ModalDeConfirmacao from '../../../componentes/ModalDeConfirmacao.jsx';

// Conteúdo de demonstração do catálogo /dev/componentes (não é dado de API).
const MODAIS = {
  padrao: {
    abrir: 'Abrir confirmação',
    props: { titulo: 'Finalizar treino?', descricao: 'O treino será salvo no seu histórico.' },
  },
  perigo: {
    abrir: 'Abrir confirmação de perigo',
    props: {
      titulo: 'Excluir treino?',
      descricao: 'Esta ação não pode ser desfeita.',
      rotuloConfirmar: 'Excluir',
      perigo: true,
    },
  },
  carregando: {
    abrir: 'Abrir confirmação carregando',
    props: {
      titulo: 'Salvar treino?',
      descricao: 'Exemplo com a confirmação em andamento: o botão Salvar fica ocupado.',
      rotuloConfirmar: 'Salvar',
      carregando: true,
    },
  },
};

const LINHA = 'flex flex-wrap items-center gap-3';

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

/** Seção "Apoio" do catálogo /dev/componentes: Avatar e ModalDeConfirmacao em todas as variações. */
export default function SecaoApoio() {
  const idDoTitulo = useId();
  const [modalAberto, setModalAberto] = useState(null);

  const modal = MODAIS[modalAberto]?.props ?? { titulo: '' };
  const fecharModal = () => setModalAberto(null);

  return (
    <section aria-labelledby={idDoTitulo} className="flex flex-col gap-8 py-6">
      <h2 id={idDoTitulo} className="text-2xl font-bold">
        Apoio
      </h2>

      <Componente nome="Avatar">
        <Legenda>Tamanhos sm, md e lg, com o nome como texto alternativo.</Legenda>
        <div className={LINHA}>
          <Avatar nome="Ana" tamanho="sm" />
          <Avatar nome="Lucas Pereira" />
          <Avatar nome="Maria Clara de Souza" tamanho="lg" />
        </div>
        <Legenda>Decorativo, ao lado do nome escrito.</Legenda>
        <p className={LINHA}>
          <Avatar nome="Lucas Pereira" decorativo />
          Lucas Pereira
        </p>
        <Legenda>Sem nome.</Legenda>
        <div className={LINHA}>
          <Avatar nome="" />
        </div>
      </Componente>

      <Componente nome="ModalDeConfirmacao">
        <Legenda>Esc ou Cancelar fecham, e o foco volta para o botão que abriu.</Legenda>
        <div className={LINHA}>
          {Object.entries(MODAIS).map(([chave, exemplo]) => (
            <Botao key={chave} variante="secundario" onClick={() => setModalAberto(chave)}>
              {exemplo.abrir}
            </Botao>
          ))}
        </div>
        <ModalDeConfirmacao
          {...modal}
          aberto={modalAberto !== null}
          aoConfirmar={fecharModal}
          aoCancelar={fecharModal}
        />
      </Componente>
    </section>
  );
}
