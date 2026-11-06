<?php

use App\Contracts\VerificadorBanco;
use Illuminate\Support\Carbon;

it('responde 200 com o banco real disponivel', function () {
    $resposta = $this->getJson('/api/v1/saude');

    $resposta->assertOk()
        ->assertJsonPath('data.status', 'ok')
        ->assertJsonPath('data.banco', 'ok')
        ->assertJsonPath('data.versao', config('app.versao'))
        ->assertJsonMissingPath('message');

    $horario = $resposta->json('data.horario');

    expect(config('app.versao'))->toBe('0.1.0')
        ->and($horario)->toMatch('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+00:00$/')
        ->and(Carbon::parse($horario)->diffInSeconds(now(), true))->toBeLessThan(60);
});

it('responde 503 quando o banco esta fora', function () {
    $this->app->bind(VerificadorBanco::class, fn () => new class implements VerificadorBanco
    {
        public function disponivel(): bool
        {
            return false;
        }
    });

    $resposta = $this->getJson('/api/v1/saude');

    $resposta->assertStatus(503)
        ->assertJsonPath('message', 'Banco de dados indisponível.')
        ->assertJsonPath('request_id', $resposta->headers->get('X-Request-Id'))
        ->assertJsonPath('data.status', 'indisponivel')
        ->assertJsonPath('data.banco', 'fora')
        ->assertJsonPath('data.versao', '0.1.0');

    expect($resposta->json('request_id'))->not->toBeEmpty()
        ->and($resposta->json('data.horario'))->not->toBeEmpty();
});

it('responde 200 em /up', function () {
    $this->get('/up')->assertOk();
});

it('responde 503 ao SPA mesmo com a sessao no banco inacessivel', function () {
    config([
        'sanctum.stateful' => ['localhost:5173'],
        'database.connections.fora' => array_merge(config('database.connections.pgsql'), [
            'host' => '127.0.0.1',
            'port' => 1,
            'options' => [PDO::ATTR_TIMEOUT => 1],
        ]),
        'session.driver' => 'database',
        'session.connection' => 'fora',
    ]);

    $this->app->bind(VerificadorBanco::class, fn () => new class implements VerificadorBanco
    {
        public function disponivel(): bool
        {
            return false;
        }
    });

    $resposta = $this->getJson('/api/v1/saude', [
        'Origin' => 'http://localhost:5173',
        'Referer' => 'http://localhost:5173/dev/status',
    ]);

    $resposta->assertStatus(503)
        ->assertJsonPath('message', 'Banco de dados indisponível.')
        ->assertJsonPath('data.banco', 'fora');
});
