<?php

use App\Models\Agendamento;
use App\Models\User;

it('remove o agendamento e mantem a sessao vinculada', function () {
    $usuario = User::factory()->create();
    $agendamento = Agendamento::factory()->for($usuario, 'usuario')->concluido()->create();
    $sessaoId = $agendamento->sessao_id;

    $this->actingAs($usuario)->deleteJson("/api/v1/agendamentos/{$agendamento->id}")
        ->assertNoContent();

    $this->assertDatabaseMissing('agendamentos', ['id' => $agendamento->id]);
    $this->assertDatabaseHas('sessoes', ['id' => $sessaoId]);
});

it('remove um agendamento pendente', function () {
    $usuario = User::factory()->create();
    $agendamento = Agendamento::factory()->for($usuario, 'usuario')->create();

    $this->actingAs($usuario)->deleteJson("/api/v1/agendamentos/{$agendamento->id}")
        ->assertNoContent();

    $this->assertDatabaseMissing('agendamentos', ['id' => $agendamento->id]);
});

it('responde 404 para agendamento de outro usuario e nada muda', function () {
    $usuario = User::factory()->create();
    $alheio = Agendamento::factory()->create();

    $this->actingAs($usuario)->deleteJson("/api/v1/agendamentos/{$alheio->id}")
        ->assertNotFound()
        ->assertJsonPath('message', 'Recurso não encontrado.');

    $this->assertDatabaseHas('agendamentos', ['id' => $alheio->id]);
});

it('responde 404 para agendamento inexistente', function () {
    $usuario = User::factory()->create();

    $this->actingAs($usuario)->deleteJson('/api/v1/agendamentos/999999')
        ->assertNotFound();
});

it('responde 401 sem sessao', function () {
    $agendamento = Agendamento::factory()->create();

    $this->deleteJson("/api/v1/agendamentos/{$agendamento->id}")
        ->assertUnauthorized();

    $this->assertDatabaseHas('agendamentos', ['id' => $agendamento->id]);
});
