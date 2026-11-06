<?php

use App\Models\Agendamento;
use App\Models\Sessao;
use App\Models\Treino;
use App\Models\User;
use App\Services\AgendamentoService;
use Illuminate\Support\Carbon;

/**
 * O POST /sessoes nasce no PR-16 (outra frente). Aqui o vínculo é testado
 * direto no service, que o SessaoService chama dentro da transação ao criar a sessão.
 */
beforeEach(function () {
    Carbon::setTestNow(Carbon::parse('2026-11-09T18:00:00Z'));
});

it('vincula a sessao ao agendamento pendente de hoje do mesmo treino e o GET mostra concluido', function () {
    $usuario = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create();
    $agendamento = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-09']);
    $sessao = Sessao::factory()->for($usuario, 'usuario')->for($treino)->create();

    $vinculado = app(AgendamentoService::class)->vincularSessaoDeHoje($sessao);

    expect($vinculado)->not->toBeNull()
        ->and($vinculado->id)->toBe($agendamento->id);

    $this->assertDatabaseHas('agendamentos', ['id' => $agendamento->id, 'sessao_id' => $sessao->id]);

    $this->actingAs($usuario)->getJson('/api/v1/agendamentos?de=2026-11-09&ate=2026-11-09')
        ->assertOk()
        ->assertJsonPath('data.0.concluido', true)
        ->assertJsonPath('data.0.sessao_id', $sessao->id);
});

it('com dois agendamentos hoje vincula so o de menor hora', function () {
    $usuario = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create();
    $semHora = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->semHora()->create(['data' => '2026-11-09']);
    $tarde = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-09', 'hora' => '18:00']);
    $manha = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-09', 'hora' => '08:00']);
    $sessao = Sessao::factory()->for($usuario, 'usuario')->for($treino)->create();

    app(AgendamentoService::class)->vincularSessaoDeHoje($sessao);

    $this->assertDatabaseHas('agendamentos', ['id' => $manha->id, 'sessao_id' => $sessao->id]);
    $this->assertDatabaseHas('agendamentos', ['id' => $tarde->id, 'sessao_id' => null]);
    $this->assertDatabaseHas('agendamentos', ['id' => $semHora->id, 'sessao_id' => null]);
});

it('nao vincula agendamento de amanha, de outro treino, de outro usuario, ja concluido ou sessao sem treino', function () {
    $usuario = User::factory()->create();
    $outro = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create();
    $outroTreino = Treino::factory()->for($usuario, 'autor')->create();

    $amanha = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-10']);
    $doOutroTreino = Agendamento::factory()->for($usuario, 'usuario')->for($outroTreino)->create(['data' => '2026-11-09']);
    $doOutroUsuario = Agendamento::factory()->for($outro, 'usuario')->for($treino)->create(['data' => '2026-11-09']);
    $concluido = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->concluido()->create(['data' => '2026-11-09']);
    $sessaoAnterior = $concluido->sessao_id;

    $sessao = Sessao::factory()->for($usuario, 'usuario')->for($treino)->create();
    $registroRapido = Sessao::factory()->for($usuario, 'usuario')->registroRapido()->create();

    $servico = app(AgendamentoService::class);

    expect($servico->vincularSessaoDeHoje($sessao))->toBeNull()
        ->and($servico->vincularSessaoDeHoje($registroRapido))->toBeNull();

    $this->assertDatabaseHas('agendamentos', ['id' => $amanha->id, 'sessao_id' => null]);
    $this->assertDatabaseHas('agendamentos', ['id' => $doOutroTreino->id, 'sessao_id' => null]);
    $this->assertDatabaseHas('agendamentos', ['id' => $doOutroUsuario->id, 'sessao_id' => null]);
    $this->assertDatabaseHas('agendamentos', ['id' => $concluido->id, 'sessao_id' => $sessaoAnterior]);
});

it('vincula pelo dia local de Sao Paulo na virada do dia (RN-01)', function () {
    // 23:30 de 2026-11-09 em São Paulo = 02:30 UTC de 2026-11-10.
    Carbon::setTestNow(Carbon::parse('2026-11-10T02:30:00Z'));

    $usuario = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create();
    $deHoje = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-09']);
    $deAmanha = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-10']);
    $sessao = Sessao::factory()->for($usuario, 'usuario')->for($treino)->create();

    app(AgendamentoService::class)->vincularSessaoDeHoje($sessao);

    $this->assertDatabaseHas('agendamentos', ['id' => $deHoje->id, 'sessao_id' => $sessao->id]);
    $this->assertDatabaseHas('agendamentos', ['id' => $deAmanha->id, 'sessao_id' => null]);
});

it('a mesma sessao nao vincula um segundo agendamento', function () {
    $usuario = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create();
    $primeiro = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-09', 'hora' => '08:00']);
    $segundo = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create(['data' => '2026-11-09', 'hora' => '18:00']);
    $sessao = Sessao::factory()->for($usuario, 'usuario')->for($treino)->create();

    $servico = app(AgendamentoService::class);
    $servico->vincularSessaoDeHoje($sessao);

    expect($servico->vincularSessaoDeHoje($sessao))->toBeNull();

    $this->assertDatabaseHas('agendamentos', ['id' => $primeiro->id, 'sessao_id' => $sessao->id]);
    $this->assertDatabaseHas('agendamentos', ['id' => $segundo->id, 'sessao_id' => null]);
});
