import { useEffect } from 'react';

export default function Pagina({ titulo, children }) {
  useEffect(() => {
    document.title = `${titulo} · VOLLEY PRO`;
  }, [titulo]);

  return (
    <section className="p-4">
      <h1 className="text-2xl font-bold">{titulo}</h1>
      {children}
    </section>
  );
}
