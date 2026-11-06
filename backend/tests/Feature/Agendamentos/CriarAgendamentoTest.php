<?php

use App\Models\Treino;
use App\Models\User;
use Illuminate\Support\Carbon;

beforeEach(function () {
    // 2026-11-09 às 15:00 em São Paulo (18:00 UTC).
    Carbon::setTestNow(Carbon::parse('2026-11-09T18:00:00Z'));
});

it('cria um agendamento com treino proprio, data de hoje e hora', function () {
    $usuario = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create([
        'nome' => 'Saque e recepção',
        'duracao_estimada_minutos' => 40,
    ]);

    $resposta = $this->actingAs($usuario)->postJson('/api/v1/agendamentos', [
        'treino_id' => $treino->id,
        'data' => '2026-11-09',
        'hora' => '18:30',
    ]);

    $resposta->assertCreated()
        ->assertJsonPath('data.data', '2026-11-09')
        ->assertJsonPath('data.hora', '18:30')
        ->assertJsonPath('data.concluido', false)
        ->assertJsonPath('data.sessao_id', null)
        ->assertJsonPath('data.treino', [
            'id' => $treino->id,
            'nome' => 'Saque e recepção',
            'duracao_estimada_minutos' => 40,
        ]);

    expect(array_keys($resposta->json('data')))
        ->toEqualCanonicalizing(['id', 'data', 'hora', 'concluido', 'sessao_id', 'treino']);

    $this->assertDatabaseHas('agendamentos', [
        'id' => $resposta->json('data.id'),
        'usuario_id' => $usuario->id,
        'treino_id' => $treino->id,
        'data' => '2026-11-09',
        'hora' => '18:30:00',
        'sessao_id' => null,
    ]);
});

it('cria um agendamento sem hora', function () {
    $usuario = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create();

    $this->actingAs($usuario)->postJson('/api/v1/agendamentos', [
        'treino_id' => $treino->id,
        'data' => '2026-11-10',
    ])
        ->assertCreated()
        ->assertJsonPath('data.data', '2026-11-10')
        ->assertJsonPath('data.hora', null);
});

it('aceita agendar para o dia local de hoje mesmo quando em UTC ja e amanha (RN-01)', function () {
    // 23:30 de 2026-11-09 em São Paulo = 02:30 UTC de 2026-11-10.
    Carbon::setTestNow(Carbon::parse('2026-11-10T02:30:00Z'));

    $usuario = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create();

    $this->actingAs($usuario)->postJson('/api/v1/agendamentos', [
        'treino_id' => $treino->id,
        'data' => '2026-11-09',
    ])->assertCreated();
});

it('responde 422 com dados invalidos', function (array $corpo, string $campo, string $mensagem) {
    $usuario = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create();

    $corpo = array_map(fn ($valor) => $valor === '{treino}' ? $treino->id : $valor, $corpo);

    $this->actingAs($usuario)->postJson('/api/v1/agendamentos', $corpo)
        ->assertStatus(422)
        ->assertJsonValidationErrors([$campo => $mensagem]);
})->with([
    'sem treino' => [['data' => '2026-11-09'], 'treino_id', 'Escolha um treino.'],
    'sem data' => [['treino_id' => '{treino}'], 'data', 'Informe a data.'],
    'data invalida' => [['treino_id' => '{treino}', 'data' => '09/11/2026'], 'data', 'O campo data deve estar no formato Y-m-d.'],
    'data passada' => [['treino_id' => '{treino}', 'data' => '2026-11-08'], 'data', 'A data não pode ser anterior a hoje.'],
    'hora fora de H:i' => [['treino_id' => '{treino}', 'data' => '2026-11-09', 'hora' => '18h30'], 'hora', 'O campo hora deve estar no formato H:i.'],
    'hora com segundos' => [['treino_id' => '{treino}', 'data' => '2026-11-09', 'hora' => '18:30:00'], 'hora', 'O campo hora deve estar no formato H:i.'],
]);

it('nao cria o agendamento quando a validacao falha', function () {
    $usuario = User::factory()->create();

    $this->actingAs($usuario)->postJson('/api/v1/agendamentos', ['data' => '2026-11-09'])
        ->assertStatus(422);

    $this->assertDatabaseCount('agendamentos', 0);
});

it('recusa treino privado de outro usuario, inexistente ou excluido sem revelar se existe (RN-06)', function () {
    $usuario = User::factory()->create();
    $outro = User::factory()->create();
    $privado = Treino::factory()->for($outro, 'autor')->create();
    $excluido = Treino::factory()->for($usuario, 'autor')->create();
    $excluido->delete();

    foreach ([$privado->id, $excluido->id, 999999] as $treinoId) {
        $this->actingAs($usuario)->postJson('/api/v1/agendamentos', [
            'treino_id' => $treinoId,
            'data' => '2026-11-09',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['treino_id' => 'Escolha um treino.']);
    }

    $this->assertDatabaseCount('agendamentos', 0);
});

it('aceita treino publico e treino do treinador vinculado (RN-06)', function () {
    $admin = User::factory()->admin()->create();
    $treinador = User::factory()->treinador()->create();
    $usuario = User::factory()->create(['treinador_id' => $treinador->id]);

    $publico = Treino::factory()->for($admin, 'autor')->publico()->create();
    $doTreinador = Treino::factory()->for($treinador, 'autor')->paraAtletas()->create();
    $privadoDoTreinador = Treino::factory()->for($treinador, 'autor')->create();

    $this->actingAs($usuario)->postJson('/api/v1/agendamentos', ['treino_id' => $publico->id, 'data' => '2026-11-09'])
        ->assertCreated();
    $this->actingAs($usuario)->postJson('/api/v1/agendamentos', ['treino_id' => $doTreinador->id, 'data' => '2026-11-09'])
        ->assertCreated();
    $this->actingAs($usuario)->postJson('/api/v1/agendamentos', ['treino_id' => $privadoDoTreinador->id, 'data' => '2026-11-09'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['treino_id']);
});

it('recusa treino para atletas de um treinador que nao e o seu (RN-06)', function () {
    $treinador = User::factory()->treinador()->create();
    $usuario = User::factory()->create();
    $doTreinador = Treino::factory()->for($treinador, 'autor')->paraAtletas()->create();

    $this->actingAs($usuario)->postJson('/api/v1/agendamentos', ['treino_id' => $doTreinador->id, 'data' => '2026-11-09'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['treino_id']);
});

it('responde 401 sem sessao', function () {
    $this->postJson('/api/v1/agendamentos', ['treino_id' => 1, 'data' => '2026-11-09'])
        ->assertUnauthorized()
        ->assertJsonPath('message', 'Não autenticado.');
});
