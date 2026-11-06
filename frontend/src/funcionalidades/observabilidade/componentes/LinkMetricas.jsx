/**
 * Link "Métricas" da área do admin para o painel do Laravel Pulse (GET /pulse, fora do SPA).
 * É navegação de documento inteiro (`<a href>`, não rota do React Router): o painel é servido pelo Laravel.
 * Quem decide o acesso é o servidor (gate só para admin); o link é só conveniência.
 */
export default function LinkMetricas() {
  return (
    <div className="mt-4 flex flex-col items-start gap-2">
      <a
        href="/pulse"
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-botao border border-borda-controle bg-superficie-elevada px-4 font-bold text-texto transition-colors hover:border-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria"
      >
        Métricas
      </a>
      <p className="text-sm text-texto-secundario">
        Abre o painel de métricas do servidor (latência, erros por rota e exceções) nesta aba, fora do app.
      </p>
    </div>
  );
}
