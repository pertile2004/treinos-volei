<?php

use App\Models\Agendamento;
use App\Models\Treino;
use App\Models\User;
use Illuminate\Support\Carbon;

beforeEach(function () {
    Carbon::setTestNow(Carbon::parse('2026-11-09T18:00:00Z'));
});

it('lista so os agendamentos do usuario no intervalo, ordenados por data, hora (sem hora por ultimo) e id', function () {
    $usuario = User::factory()->create();
    $outro = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create();

    $terca = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-10', 'hora' => '07:00']);
    $segundaSemHora = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->semHora()->create(['data' => '2026-11-09']);
    $segundaTarde = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-09', 'hora' => '18:30']);
    $segundaManha = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-09', 'hora' => '08:00']);
    $segundaManhaDepois = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-09', 'hora' => '08:00']);
    $domingo = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-15', 'hora' => '10:00']);

    Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-08']);
    Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-16']);
    Agendamento::factory()->for($outro, 'usuario')->create(['data' => '2026-11-10']);

    $resposta = $this->actingAs($usuario)->getJson('/api/v1/agendamentos?de=2026-11-09&ate=2026-11-15');

    $resposta->assertOk();

    expect($resposta->json('data.*.id'))->toBe([
        $segundaManha->id,
        $segundaManhaDepois->id,
        $segundaTarde->id,
        $segundaSemHora->id,
        $terca->id,
        $domingo->id,
    ])
        ->and(array_keys($resposta->json()))->toBe(['data'])
        ->and($resposta->json('data.0.hora'))->toBe('08:00')
        ->and($resposta->json('data.3.hora'))->toBeNull()
        ->and($resposta->json('data.0.treino.id'))->toBe($treino->id)
        ->and($resposta->json('data.0.concluido'))->toBeFalse();
});

it('mostra concluido e o treino mesmo quando o treino ja foi excluido', function () {
    $usuario = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create(['nome' => 'Treino antigo']);
    $concluido = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->concluido()->create(['data' => '2026-11-09']);
    $treino->delete();

    $resposta = $this->actingAs($usuario)->getJson('/api/v1/agendamentos?de=2026-11-09&ate=2026-11-09');

    $resposta->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.concluido', true)
        ->assertJsonPath('data.0.sessao_id', $concluido->sessao_id)
        ->assertJsonPath('data.0.treino.nome', 'Treino antigo');
});

it('aceita um intervalo de exatamente 31 dias e devolve lista vazia quando nao ha nada', function () {
    $usuario = User::factory()->create();

    $this->actingAs($usuario)->getJson('/api/v1/agendamentos?de=2026-11-01&ate=2026-12-01')
        ->assertOk()
        ->assertExactJson(['data' => []]);
});

it('responde 422 com intervalo invalido', function (string $query, string $campo) {
    $usuario = User::factory()->create();

    $this->actingAs($usuario)->getJson('/api/v1/agendamentos'.$query)
        ->assertStatus(422)
        ->assertJsonValidationErrors([$campo]);
})->with([
    'sem de e ate' => ['', 'de'],
    'sem ate' => ['?de=2026-11-09', 'ate'],
    'de invalido' => ['?de=09-11-2026&ate=2026-11-15', 'de'],
    'ate antes de de' => ['?de=2026-11-15&ate=2026-11-09', 'ate'],
    'mais de 31 dias' => ['?de=2026-11-01&ate=2026-12-02', 'ate'],
]);

it('explica o limite de 31 dias', function () {
    $usuario = User::factory()->create();

    $this->actingAs($usuario)->getJson('/api/v1/agendamentos?de=2026-11-01&ate=2026-12-02')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['ate' => 'O intervalo não pode passar de 31 dias.']);
});

it('responde 401 sem sessao', function () {
    $this->getJson('/api/v1/agendamentos?de=2026-11-09&ate=2026-11-15')
        ->assertUnauthorized();
});
