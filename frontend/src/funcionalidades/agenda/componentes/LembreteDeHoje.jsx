import { useState } from 'react';
import Botao from '../../../componentes/Botao.jsx';
import { useHoje } from '../../../lib/useHoje.js';
import { useAgendamentosDeHoje } from '../hooks.js';

/** Chave no sessionStorage com o dia (AAAA-MM-DD) em que o lembrete foi dispensado. Preferência local, não dado. */
export const CHAVE_DA_DISPENSA = 'volleypro.lembrete-dispensado-em';

function lerDispensa() {
  try {
    return window.sessionStorage.getItem(CHAVE_DA_DISPENSA);
  } catch {
    return null;
  }
}

function guardarDispensa(dia) {
  try {
    window.sessionStorage.setItem(CHAVE_DA_DISPENSA, dia);
  } catch {
    // Sem armazenamento (janela privada ou bloqueio): a dispensa vale só nesta tela.
  }
}

function textoDoLembrete(pendentes) {
  if (pendentes.length === 1) {
    const [{ treino, hora }] = pendentes;
    return `Você tem treino hoje: ${treino.nome}${hora ? ` às ${hora}` : ''}.`;
  }
  return `Você tem ${pendentes.length} treinos pendentes hoje.`;
}

/**
 * Aviso discreto, não bloqueante, de treino de hoje ainda pendente. Não rouba o foco (role="status").
 * Carregando, erro, sem pendentes ou já dispensado hoje: não mostra nada.
 */
export default function LembreteDeHoje() {
  const hoje = useHoje();
  const consulta = useAgendamentosDeHoje();
  const [dispensadoEm, setDispensadoEm] = useState(lerDispensa);

  if (dispensadoEm === hoje || !consulta.isSuccess) return null;
  const pendentes = consulta.data.filter((agendamento) => !agendamento.concluido);
  if (pendentes.length === 0) return null;

  function dispensar() {
    guardarDispensa(hoje);
    setDispensadoEm(hoje);
  }

  return (
    <div
      role="status"
      className="m-4 flex flex-wrap items-center gap-3 rounded-cartao border border-primaria bg-superficie-elevada p-4 text-texto"
    >
      <p className="min-w-0 flex-1">{textoDoLembrete(pendentes)}</p>
      <div className="flex flex-wrap gap-2">
        <Botao para="/agenda" variante="secundario" tamanho="sm">
          Ver agenda
        </Botao>
        <Botao variante="fantasma" tamanho="sm" onClick={dispensar}>
          Dispensar
        </Botao>
      </div>
    </div>
  );
}
