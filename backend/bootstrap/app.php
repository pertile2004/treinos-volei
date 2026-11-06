<?php

use App\Http\Middleware\CabecalhosSeguranca;
use App\Http\Middleware\RequestId;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api/v1',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend([RequestId::class, CabecalhosSeguranca::class]);

        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request): bool => $request->is('api/*') || $request->expectsJson(),
        );

        // Toda resposta de erro em JSON sai no formato padrão da API:
        // message e request_id (e errors em 422), sem detalhes internos fora do ambiente local com debug.
        $exceptions->respond(function (Response $response, Throwable $e, Request $request): Response {
            if (! $response instanceof JsonResponse) {
                return $response;
            }

            $original = (array) $response->getData(true);

            $mensagem = match ($response->getStatusCode()) {
                401 => 'Não autenticado.',
                403 => 'Ação não autorizada.',
                404 => 'Recurso não encontrado.',
                405 => 'Método não permitido.',
                429 => 'Muitas tentativas. Tente de novo em instantes.',
                500 => 'Erro interno do servidor.',
                503 => 'Serviço indisponível.',
                default => is_string($original['message'] ?? null) && $original['message'] !== ''
                    ? $original['message']
                    : 'Não foi possível concluir a requisição.',
            };

            $corpo = ['message' => $mensagem];

            if (isset($original['errors'])) {
                $corpo['errors'] = $original['errors'];
            }

            $corpo['request_id'] = Context::get('request_id');

            if (app()->isLocal() && config('app.debug') === true) {
                $corpo += array_intersect_key($original, array_flip(['exception', 'file', 'line', 'trace']));
            }

            return $response->setData($corpo);
        });
    })->create();
