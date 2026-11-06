import { useId } from 'react';

/** Caixa "Vibrar ao fim do descanso": desligada por padrão e nunca o único aviso. */
export default function OpcaoVibrar({ ligado, aoAlternar }) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-center gap-3">
      <input
        id={id}
        type="checkbox"
        checked={ligado}
        onChange={(evento) => aoAlternar(evento.target.checked)}
        className="size-6 accent-primaria"
      />
      <label htmlFor={id} className="text-base text-texto">
        Vibrar ao fim do descanso
      </label>
    </div>
  );
}
