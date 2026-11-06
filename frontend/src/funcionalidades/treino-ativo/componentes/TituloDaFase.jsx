import { useEffect, useRef } from 'react';

/** Título (h2) da fase atual. Recebe o foco ao aparecer, para o leitor de tela acompanhar cada transição. */
export default function TituloDaFase({ children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <h2 ref={ref} tabIndex={-1} className={`text-xl font-bold break-words ${className}`.trim()}>
      {children}
    </h2>
  );
}
