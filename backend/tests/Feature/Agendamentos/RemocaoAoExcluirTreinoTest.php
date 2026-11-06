<?php

use App\Models\Agendamento;
use App\Models\Treino;
use App\Models\User;
use App\Services\AgendamentoService;
use Illuminate\Support\Carbon;

/**
 * RN-08: o DELETE /treinos/{id} nasce no PR-15 (outra frente). Aqui a remoção
 * é testada direto no service, que o service de exclusão de treino chama na transação.
 */
beforeEach(function () {
    Carbon::setTestNow(Carbon::parse('2026-11-09T18:00:00Z'));
});

it('remove os agendamentos pendentes de hoje em diante, de todos os usuarios, e mantem passados, concluidos e sessoes (RN-08)', function () {
    $admin = User::factory()->admin()->create();
    $usuario = User::factory()->create();
    $outro = User::factory()->create();
    $treino = Treino::factory()->for($admin, 'autor')->publico()->create();
    $outroTreino = Treino::factory()->for($usuario, 'autor')->create();

    $hojePendente = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-09']);
    $futuroPendente = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-20']);
    $futuroDoOutro = Agendamento::factory()->for($outro, 'usuario')->for($treino)->create(['data' => '2026-11-12']);
    $passado = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-08']);
    $hojeConcluido = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->concluido()->create(['data' => '2026-11-09']);
    $futuroDeOutroTreino = Agendamento::factory()->for($usuario, 'usuario')->for($outroTreino)->create(['data' => '2026-11-20']);

    $removidos = app(AgendamentoService::class)->removerFuturosDoTreino($treino);

    expect($removidos)->toBe(3);

    $this->assertDatabaseMissing('agendamentos', ['id' => $hojePendente->id]);
    $this->assertDatabaseMissing('agendamentos', ['id' => $futuroPendente->id]);
    $this->assertDatabaseMissing('agendamentos', ['id' => $futuroDoOutro->id]);

    $this->assertDatabaseHas('agendamentos', ['id' => $passado->id]);
    $this->assertDatabaseHas('agendamentos', ['id' => $hojeConcluido->id, 'sessao_id' => $hojeConcluido->sessao_id]);
    $this->assertDatabaseHas('agendamentos', ['id' => $futuroDeOutroTreino->id]);
    $this->assertDatabaseHas('sessoes', ['id' => $hojeConcluido->sessao_id]);
});

it('usa o dia local de Sao Paulo para decidir o que e futuro (RN-01)', function () {
    // 23:30 de 2026-11-09 em São Paulo = 02:30 UTC de 2026-11-10.
    Carbon::setTestNow(Carbon::parse('2026-11-10T02:30:00Z'));

    $usuario = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create();
    $deHoje = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-09']);
    $deOntem = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-08']);

    app(AgendamentoService::class)->removerFuturosDoTreino($treino);

    $this->assertDatabaseMissing('agendamentos', ['id' => $deHoje->id]);
    $this->assertDatabaseHas('agendamentos', ['id' => $deOntem->id]);
});

it('funciona com o treino ja excluido logicamente', function () {
    $usuario = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create();
    $futuro = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-20']);
    $treino->delete();

    expect(app(AgendamentoService::class)->removerFuturosDoTreino($treino))->toBe(1);

    $this->assertDatabaseMissing('agendamentos', ['id' => $futuro->id]);
});
