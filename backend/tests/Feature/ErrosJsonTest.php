<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    config(['app.debug' => false]);
});

it('responde 404 em JSON com request id e sem detalhes internos', function () {
    $resposta = $this->get('/api/v1/nao-existe');

    $resposta->assertNotFound()
        ->assertHeader('Content-Type', 'application/json')
        ->assertExactJson([
            'message' => 'Recurso não encontrado.',
            'request_id' => $resposta->headers->get('X-Request-Id'),
        ]);

    expect($resposta->json('request_id'))->not->toBeEmpty();

    foreach (['exception', 'file', 'line', 'trace'] as $chave) {
        $resposta->assertJsonMissingPath($chave);
    }
});

it('responde 405 em JSON com request id e cabecalhos de seguranca', function () {
    $resposta = $this->post('/api/v1/saude');

    $resposta->assertStatus(405)
        ->assertExactJson([
            'message' => 'Método não permitido.',
            'request_id' => $resposta->headers->get('X-Request-Id'),
        ])
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
        ->assertHeaderMissing('Strict-Transport-Security');
});

it('envia os cabecalhos de seguranca nas respostas de sucesso', function () {
    $this->getJson('/api/v1/referencias')
        ->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
        ->assertHeaderMissing('Strict-Transport-Security');
});

it('envia Strict-Transport-Security so em producao', function () {
    $this->app->detectEnvironment(fn () => 'production');

    $this->getJson('/api/v1/referencias')
        ->assertOk()
        ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});

it('padroniza a mensagem de cada erro da API', function (int $status, string $mensagem) {
    Route::get('/api/v1/teste-de-erro/{status}', function (int $status) {
        if ($status === 401) {
            throw new AuthenticationException;
        }

        if ($status === 500) {
            throw new RuntimeException('detalhe interno que nao pode vazar');
        }

        abort($status, 'detalhe interno que nao pode vazar');
    });

    $resposta = $this->get("/api/v1/teste-de-erro/{$status}");

    $resposta->assertStatus($status)
        ->assertExactJson([
            'message' => $mensagem,
            'request_id' => $resposta->headers->get('X-Request-Id'),
        ]);
})->with([
    'nao autenticado' => [401, 'Não autenticado.'],
    'nao autorizado' => [403, 'Ação não autorizada.'],
    'nao encontrado' => [404, 'Recurso não encontrado.'],
    'muitas tentativas' => [429, 'Muitas tentativas. Tente de novo em instantes.'],
    'erro interno' => [500, 'Erro interno do servidor.'],
    'indisponivel' => [503, 'Serviço indisponível.'],
]);

it('responde 422 com a mensagem do validador, os erros e o request id', function () {
    Route::post('/api/v1/teste-de-validacao', function (Request $request) {
        $request->validate(['nome' => ['required', 'string']]);
    });

    $resposta = $this->post('/api/v1/teste-de-validacao');

    $resposta->assertStatus(422)
        ->assertJsonPath('request_id', $resposta->headers->get('X-Request-Id'))
        ->assertJsonValidationErrors(['nome' => 'O campo nome é obrigatório.']);

    expect($resposta->json('message'))->toBe('O campo nome é obrigatório.')
        ->and(array_keys($resposta->json()))->toEqualCanonicalizing(['message', 'errors', 'request_id']);
});

it('resume em portugues quando ha mais de um erro de validacao', function () {
    Route::post('/api/v1/teste-de-validacao', function (Request $request) {
        $request->validate(['nome' => ['required'], 'email' => ['required', 'email']]);
    });

    $this->post('/api/v1/teste-de-validacao', ['email' => 'invalido'])
        ->assertStatus(422)
        ->assertJsonPath('message', 'O campo nome é obrigatório. (e mais 1 erro)')
        ->assertJsonValidationErrors(['email' => 'O campo email deve ser um endereço de e-mail válido.']);
});

it('nao expoe detalhes internos fora do ambiente local mesmo com o debug ligado', function () {
    config(['app.debug' => true]);
    $this->app->detectEnvironment(fn () => 'production');

    Route::get('/api/v1/teste-de-erro-debug', function () {
        throw new RuntimeException('detalhe interno que nao pode vazar');
    });

    $resposta = $this->get('/api/v1/teste-de-erro-debug');

    $resposta->assertStatus(500)
        ->assertExactJson([
            'message' => 'Erro interno do servidor.',
            'request_id' => $resposta->headers->get('X-Request-Id'),
        ]);
});
