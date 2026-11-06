<?php

use App\Models\Agendamento;
use App\Models\Treino;
use App\Models\User;
use Illuminate\Support\Carbon;

beforeEach(function () {
    Carbon::setTestNow(Carbon::parse('2026-11-09T18:00:00Z'));
});

it('altera data e hora do agendamento', function () {
    $usuario = User::factory()->create();
    $agendamento = Agendamento::factory()->for($usuario, 'usuario')->create(['data' => '2026-11-09', 'hora' => '18:00']);

    $this->actingAs($usuario)->patchJson("/api/v1/agendamentos/{$agendamento->id}", [
        'data' => '2026-11-11',
        'hora' => '07:15',
    ])
        ->assertOk()
        ->assertJsonPath('data.id', $agendamento->id)
        ->assertJsonPath('data.data', '2026-11-11')
        ->assertJsonPath('data.hora', '07:15')
        ->assertJsonPath('data.concluido', false)
        ->assertJsonPath('data.treino.id', $agendamento->treino_id);

    $this->assertDatabaseHas('agendamentos', ['id' => $agendamento->id, 'data' => '2026-11-11', 'hora' => '07:15:00']);
});

it('altera so a hora, inclusive para null', function () {
    $usuario = User::factory()->create();
    $agendamento = Agendamento::factory()->for($usuario, 'usuario')->create(['data' => '2026-11-09', 'hora' => '18:00']);

    $this->actingAs($usuario)->patchJson("/api/v1/agendamentos/{$agendamento->id}", ['hora' => null])
        ->assertOk()
        ->assertJsonPath('data.data', '2026-11-09')
        ->assertJsonPath('data.hora', null);

    $this->assertDatabaseHas('agendamentos', ['id' => $agendamento->id, 'data' => '2026-11-09', 'hora' => null]);
});

it('nao altera treino_id nem sessao_id', function () {
    $usuario = User::factory()->create();
    $outroTreino = Treino::factory()->for($usuario, 'autor')->create();
    $agendamento = Agendamento::factory()->for($usuario, 'usuario')->create(['data' => '2026-11-09']);

    $this->actingAs($usuario)->patchJson("/api/v1/agendamentos/{$agendamento->id}", [
        'data' => '2026-11-10',
        'treino_id' => $outroTreino->id,
        'sessao_id' => 123,
    ])->assertOk();

    $this->assertDatabaseHas('agendamentos', [
        'id' => $agendamento->id,
        'treino_id' => $agendamento->treino_id,
        'sessao_id' => null,
        'data' => '2026-11-10',
    ]);
});

it('responde 422 em agendamento ja concluido', function () {
    $usuario = User::factory()->create();
    $agendamento = Agendamento::factory()->for($usuario, 'usuario')->concluido()->create(['data' => '2026-11-09']);

    $this->actingAs($usuario)->patchJson("/api/v1/agendamentos/{$agendamento->id}", ['data' => '2026-11-10'])
        ->assertStatus(422)
        ->assertJsonPath('message', 'Este agendamento já foi concluído.');

    $this->assertDatabaseHas('agendamentos', ['id' => $agendamento->id, 'data' => '2026-11-09']);
});

it('responde 422 com dados invalidos', function (array $corpo, string $campo, string $mensagem) {
    $usuario = User::factory()->create();
    $agendamento = Agendamento::factory()->for($usuario, 'usuario')->create(['data' => '2026-11-09']);

    $this->actingAs($usuario)->patchJson("/api/v1/agendamentos/{$agendamento->id}", $corpo)
        ->assertStatus(422)
        ->assertJsonValidationErrors([$campo => $mensagem]);
})->with([
    'data passada' => [['data' => '2026-11-08'], 'data', 'A data não pode ser anterior a hoje.'],
    'data invalida' => [['data' => 'amanha'], 'data', 'O campo data deve estar no formato Y-m-d.'],
    'data nula' => [['data' => null], 'data', 'Informe a data.'],
    'hora invalida' => [['hora' => '7h'], 'hora', 'O campo hora deve estar no formato H:i.'],
]);

it('responde 404 para agendamento de outro usuario e nada muda', function () {
    $usuario = User::factory()->create();
    $alheio = Agendamento::factory()->create(['data' => '2026-11-09', 'hora' => '18:00']);

    $this->actingAs($usuario)->patchJson("/api/v1/agendamentos/{$alheio->id}", ['data' => '2026-11-10'])
        ->assertNotFound()
        ->assertJsonPath('message', 'Recurso não encontrado.');

    $this->assertDatabaseHas('agendamentos', ['id' => $alheio->id, 'data' => '2026-11-09', 'hora' => '18:00:00']);
});

it('responde 404 para agendamento inexistente', function () {
    $usuario = User::factory()->create();

    $this->actingAs($usuario)->patchJson('/api/v1/agendamentos/999999', ['data' => '2026-11-10'])
        ->assertNotFound();
});

it('responde 401 sem sessao', function () {
    $agendamento = Agendamento::factory()->create();

    $this->patchJson("/api/v1/agendamentos/{$agendamento->id}", ['data' => '2026-11-10'])
        ->assertUnauthorized();
});
