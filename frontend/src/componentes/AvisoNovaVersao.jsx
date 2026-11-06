import Botao from './Botao.jsx';

/**
 * Aviso não bloqueante de nova versão do app. Fica fixo no topo, longe da NavInferior e do botão principal
 * do treino, não rouba o foco e não some sozinho (WCAG 2.2.1): só "Atualizar" ou "Depois" o fecham.
 */
export default function AvisoNovaVersao({ aberto, aoAtualizar, aoAdiar, atualizando = false }) {
  if (!aberto) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 top-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-cartao border border-borda bg-superficie-elevada p-4 text-texto shadow-lg lg:left-auto lg:right-4 lg:max-w-sm"
    >
      <p className="font-bold">Nova versão disponível.</p>
      <div className="flex flex-wrap gap-2">
        <Botao onClick={aoAtualizar} carregando={atualizando}>
          Atualizar
        </Botao>
        <Botao variante="secundario" onClick={aoAdiar}>
          Depois
        </Botao>
      </div>
    </div>
  );
}
