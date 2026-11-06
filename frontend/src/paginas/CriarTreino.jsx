import { useEffect, useId, useRef, useState } from 'react';
import Botao from '../componentes/Botao.jsx';
import Pagina from '../componentes/Pagina.jsx';
import FormularioTreino from '../funcionalidades/treinos/componentes/FormularioTreino.jsx';

/** Confirmação depois de salvar: resumo do treino e os caminhos a seguir. O detalhe do treino chega no PR-13. */
function TreinoCriado({ treino, aoCriarOutro }) {
  const idTitulo = useId();
  const refTitulo = useRef(null);
  const quantidade = treino.itens?.length ?? 0;

  useEffect(() => {
    refTitulo.current?.focus();
  }, []);

  return (
    <section
      role="status"
      aria-labelledby={idTitulo}
      className="mt-4 flex flex-col gap-3 rounded-cartao border border-borda bg-superficie p-4"
    >
      <h2
        id={idTitulo}
        ref={refTitulo}
        tabIndex={-1}
        className="text-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria"
      >
        Treino criado.
      </h2>
      <p>
        <span className="font-bold">{treino.nome}</span> · {quantidade} {quantidade === 1 ? 'exercício' : 'exercícios'}
        {treino.duracao_estimada_minutos != null && ` · cerca de ${treino.duracao_estimada_minutos} min`}
      </p>
      <div className="flex flex-wrap gap-2">
        <Botao para={`/treinos/${treino.id}`}>Ver treino</Botao>
        <Botao variante="secundario" para="/biblioteca">
          Voltar para a Biblioteca
        </Botao>
        <Botao variante="fantasma" onClick={aoCriarOutro}>
          Criar outro treino
        </Botao>
      </div>
    </section>
  );
}

/**
 * Tela Criar treino (/treinos/novo). `papel` do usuário logado restringe a visibilidade (RN-06);
 * sem ele, todas as opções aparecem e o servidor valida.
 */
export default function CriarTreino({ papel }) {
  const [criado, setCriado] = useState(null);

  return (
    <Pagina titulo="Criar treino">
      {criado ? (
        <TreinoCriado treino={criado} aoCriarOutro={() => setCriado(null)} />
      ) : (
        <>
          <div className="mt-2">
            <Botao variante="fantasma" para="/biblioteca">
              Voltar para a Biblioteca
            </Botao>
          </div>
          <FormularioTreino papel={papel} aoCriar={setCriado} />
        </>
      )}
    </Pagina>
  );
}
