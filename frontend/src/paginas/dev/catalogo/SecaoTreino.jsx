import { useId, useState } from 'react';
import BarraDeProgresso from '../../../componentes/BarraDeProgresso.jsx';
import Cronometro from '../../../componentes/Cronometro.jsx';
import Stepper from '../../../componentes/Stepper.jsx';

function Componente({ nome, children }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-bold">{nome}</h3>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </div>
  );
}

function Exemplo({ legenda, className = '', children }) {
  return (
    <div className={`flex flex-col gap-3 rounded-cartao border border-borda bg-superficie p-4 ${className}`}>
      <p className="text-sm text-texto-secundario">{legenda}</p>
      {children}
    </div>
  );
}

function StepperDeExemplo({ inicial, ...props }) {
  const [valor, setValor] = useState(inicial);
  return <Stepper valor={valor} aoMudar={setValor} {...props} />;
}

/** Seção "Treino" do catálogo /dev/componentes: Stepper, BarraDeProgresso e Cronometro em todos os estados. */
export default function SecaoTreino() {
  const idDoTitulo = useId();

  return (
    <section aria-labelledby={idDoTitulo} className="flex flex-col gap-8 py-6">
      <h2 id={idDoTitulo} className="text-2xl font-bold">
        Treino
      </h2>

      <Componente nome="Stepper">
        <Exemplo legenda="Normal (de 1 a 30)">
          <StepperDeExemplo rotulo="Repetições" inicial={10} min={1} max={30} />
        </Exemplo>
        <Exemplo legenda="No mínimo">
          <StepperDeExemplo rotulo="Séries" inicial={1} min={1} max={10} />
        </Exemplo>
        <Exemplo legenda="No máximo (passo de 15)">
          <StepperDeExemplo rotulo="Descanso em segundos" inicial={120} max={120} passo={15} />
        </Exemplo>
        <Exemplo legenda="Desabilitado">
          <StepperDeExemplo rotulo="Carga" inicial={5} disabled />
        </Exemplo>
      </Componente>

      <Componente nome="BarraDeProgresso">
        <Exemplo legenda="Parcial" className="w-full sm:w-72">
          <BarraDeProgresso rotulo="Progresso do treino" valor={45} />
        </Exemplo>
        <Exemplo legenda="Completa (8 de 8)" className="w-full sm:w-72">
          <BarraDeProgresso rotulo="Séries concluídas" valor={8} max={8} />
        </Exemplo>
        <Exemplo legenda="Sem dados (valor nulo)" className="w-full sm:w-72">
          <BarraDeProgresso rotulo="Volume de treino (min)" valor={null} />
        </Exemplo>
        <Exemplo legenda="Sem texto visível" className="w-full sm:w-72">
          <BarraDeProgresso rotulo="Aquecimento" valor={70} mostrarTexto={false} />
        </Exemplo>
      </Componente>

      <Componente nome="Cronometro">
        <Exemplo legenda="Grande (padrão)">
          <Cronometro rotulo="Tempo de treino" segundos={754} />
        </Exemplo>
        <Exemplo legenda="Médio">
          <Cronometro rotulo="Descanso" segundos={45} tamanho="medio" />
        </Exemplo>
        <Exemplo legenda="A partir de 1 hora">
          <Cronometro rotulo="Tempo total" segundos={3725} />
        </Exemplo>
      </Componente>
    </section>
  );
}
