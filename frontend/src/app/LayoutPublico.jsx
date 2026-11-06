import { Outlet } from 'react-router';

/** Layout das páginas públicas (sem sessão): só o landmark main, centralizado e estreito, sem navegação. */
export default function LayoutPublico() {
  return (
    <div className="min-h-dvh bg-fundo text-texto">
      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-lg">
        <Outlet />
      </main>
    </div>
  );
}
