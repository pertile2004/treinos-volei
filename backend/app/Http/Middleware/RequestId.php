<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestId
{
    public const string CABECALHO = 'X-Request-Id';

    private const string FORMATO = '/\A[A-Za-z0-9._-]{8,64}\z/';

    /**
     * Identifica a requisição: aproveita o id enviado pelo cliente quando é
     * válido, senão gera um, e o propaga para o log e para a resposta.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $recebido = $request->headers->get(self::CABECALHO);

        $id = is_string($recebido) && preg_match(self::FORMATO, $recebido) === 1
            ? $recebido
            : (string) Str::uuid();

        Context::add('request_id', $id);

        $response = $next($request);

        $response->headers->set(self::CABECALHO, $id);

        return $response;
    }
}
