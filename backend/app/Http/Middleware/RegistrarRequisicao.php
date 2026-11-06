<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Http\Request;
use Illuminate\Log\LogManager;
use Illuminate\Support\Facades\Context;
use Symfony\Component\HttpFoundation\Response;

class RegistrarRequisicao
{
    public function __construct(
        private readonly LogManager $log,
        private readonly Repository $config,
    ) {}

    /**
     * Grava uma linha de log estruturada por requisição no canal de requisições
     * (config logging.requisicoes): é a fonte da latência e da taxa de erros por
     * rota, correlacionada com o restante do log pelo request_id.
     *
     * Só entram o padrão da rota (nunca a URL com ids), o método, o status, a
     * duração e o id do usuário: sem corpo, query string, cookies ou e-mail.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $inicio = hrtime(true);

        $response = $next($request);

        $canal = $this->config->get('logging.requisicoes');

        $this->log->channel(is_string($canal) ? $canal : null)->info('requisicao', [
            'request_id' => Context::get('request_id'),
            'metodo' => $request->getMethod(),
            'rota' => $request->route()?->uri(),
            'status' => $response->getStatusCode(),
            'duracao_ms' => round((hrtime(true) - $inicio) / 1_000_000, 2),
            'usuario_id' => $request->user()?->getAuthIdentifier(),
        ]);

        return $response;
    }
}
