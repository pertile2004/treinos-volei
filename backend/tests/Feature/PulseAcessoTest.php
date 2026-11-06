<?php

use App\Enums\Papel;
use App\Models\User;
use Laravel\Pulse\Facades\Pulse;

/**
 * Cria um usuário com o papel pedido. O papel fica só em memória (forceFill sem
 * salvar) porque a coluna `papel` da tabela users entra com o PR-04; depois dele
 * o mesmo código continua válido, com o cast para o enum Papel.
 */
function usuarioComPapel(Papel $papel): User
{
    return User::factory()->create()->forceFill(['papel' => $papel->value]);
}

it('mostra o painel do Pulse para o admin', function () {
    $this->actingAs(usuarioComPapel(Papel::Admin))
        ->get('/pulse')
        ->assertOk()
        ->assertSee('Pulse');
});

it('nega o painel do Pulse para quem nao e admin', function (Papel $papel) {
    $this->actingAs(usuarioComPapel($papel))
        ->get('/pulse')
        ->assertForbidden();
})->with([
    'jogador' => Papel::Jogador,
    'treinador' => Papel::Treinador,
]);

it('nega o painel do Pulse para o visitante', function () {
    $this->get('/pulse')->assertForbidden();
});

it('nega o painel do Pulse para usuario sem papel definido', function () {
    $this->actingAs(User::factory()->create())
        ->get('/pulse')
        ->assertForbidden();
});

it('nao libera o painel do Pulse pelo ambiente local', function () {
    $this->app->detectEnvironment(fn () => 'local');

    $this->get('/pulse')->assertForbidden();

    $this->actingAs(usuarioComPapel(Papel::Jogador))
        ->get('/pulse')
        ->assertForbidden();
});

it('devolve o request id tambem no painel do Pulse', function () {
    $this->actingAs(usuarioComPapel(Papel::Admin))
        ->get('/pulse', ['X-Request-Id' => 'pulse-12345678'])
        ->assertOk()
        ->assertHeader('X-Request-Id', 'pulse-12345678');
});

it('resolve o usuario do Pulse sem e-mail nem avatar externo', function () {
    $usuario = User::factory()->create();

    $dados = Pulse::resolveUsers(collect([$usuario->getKey()]))->find($usuario->getKey());

    expect($dados->name)->toBe($usuario->name)
        ->and($dados->extra)->toBe('id '.$usuario->getKey())
        ->and($dados->extra)->not->toContain($usuario->email)
        ->and(property_exists($dados, 'avatar'))->toBeFalse();
});
