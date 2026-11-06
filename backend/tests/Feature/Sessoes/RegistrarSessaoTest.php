<?php

use App\Enums\Fundamento;
use App\Models\Exercicio;
use App\Models\Sessao;
use App\Models\SessaoSerie;
use App\Models\Treino;
use App\Models\TreinoItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Corpo válido de POST /sessoes para um treino com os exercícios informados.
 *
 * @param  array<string, mixed>  $sobrescrever
 * @return array<string, mixed>
 */
function corpoDaSessao(Treino $treino, array $sobrescrever = []): array
{
    $exercicioId = $treino->itens()->orderBy('ordem')->value('exercicio_id');

    return array_replace([
        'id_cliente' => (string) Str::uuid(),
        'origem' => 'cronometro',
        'treino_id' => $treino->id,
        'iniciada_em' => '2026-11-06T21:00:00Z',
        'finalizada_em' => '2026-11-06T21:38:10Z',
        'duracao_segundos' => 2100,
        'observacao' => null,
        'series' => [
            ['exercicio_id' => $exercicioId, 'numero' => 1, 'repeticoes' => 10, 'acertos' => 7, 'erros' => 3, 'duracao_segundos' => 95],
            ['exercicio_id' => $exercicioId, 'numero' => 2, 'repeticoes' => 10, 'acertos' => 8, 'erros' => 2, 'duracao_segundos' => 88],
        ],
    ], $sobrescrever);
}

beforeEach(function () {
    $this->usuario = User::factory()->create();
    $this->exercicio = Exercicio::factory()->doFundamento(Fundamento::Recepcao)->create(['nome' => 'Manchete na parede']);
    $this->treino = Treino::factory()->for($this->usuario, 'autor')->create(['nome' => 'Recepção básica']);
    $this->treino->itens()->create([
        'exercicio_id' => $this->exercicio->id,
        'etapa' => 'tecnica',
        'ordem' => 1,
        'series' => 3,
        'repeticoes' => 10,
        'descanso_segundos' => 45,
    ]);
});

it('grava a sessao e as series em uma operacao, com fundamento do exercicio e usuario logado', function () {
    $corpo = corpoDaSessao($this->treino);

    $resposta = $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', $corpo);

    $resposta->assertCreated()
        ->assertJsonPath('data.id_cliente', $corpo['id_cliente'])
        ->assertJsonPath('data.origem', 'cronometro')
        ->assertJsonPath('data.treino', ['id' => $this->treino->id, 'nome' => 'Recepção básica'])
        ->assertJsonPath('data.iniciada_em', '2026-11-06T21:00:00Z')
        ->assertJsonPath('data.finalizada_em', '2026-11-06T21:38:10Z')
        ->assertJsonPath('data.duracao_segundos', 2100)
        ->assertJsonPath('data.observacao', null)
        ->assertJsonCount(2, 'data.series')
        ->assertJsonPath('data.series.0.exercicio', ['id' => $this->exercicio->id, 'nome' => 'Manchete na parede', 'removido' => false])
        ->assertJsonPath('data.series.0.fundamento', 'recepcao')
        ->assertJsonPath('data.series.0.numero', 1)
        ->assertJsonPath('data.series.0.repeticoes', 10)
        ->assertJsonPath('data.series.0.acertos', 7)
        ->assertJsonPath('data.series.0.erros', 3)
        ->assertJsonPath('data.series.0.duracao_segundos', 95)
        ->assertJsonPath('data.series.1.numero', 2);

    expect(array_keys($resposta->json('data')))->toBe([
        'id', 'id_cliente', 'origem', 'treino', 'iniciada_em', 'finalizada_em', 'duracao_segundos', 'observacao', 'series',
    ])->and(array_keys($resposta->json('data.series.0')))->toBe([
        'id', 'exercicio', 'fundamento', 'numero', 'repeticoes', 'acertos', 'erros', 'duracao_segundos',
    ]);

    $sessao = Sessao::query()->findOrFail($resposta->json('data.id'));

    expect(Sessao::query()->count())->toBe(1)
        ->and(SessaoSerie::query()->count())->toBe(2)
        ->and($sessao->usuario_id)->toBe($this->usuario->id)
        ->and($sessao->treino_id)->toBe($this->treino->id)
        ->and($sessao->iniciada_em->toIso8601ZuluString())->toBe('2026-11-06T21:00:00Z')
        ->and(DB::table('sessao_series')->where('sessao_id', $sessao->id)->pluck('fundamento')->all())->toBe(['recepcao', 'recepcao']);
});

it('converte a data recebida com fuso para o mesmo instante em UTC', function () {
    $corpo = corpoDaSessao($this->treino, [
        'iniciada_em' => '2026-11-06T18:00:00-03:00',
        'finalizada_em' => '2026-11-06T18:38:10.000-03:00',
    ]);

    $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', $corpo)
        ->assertCreated()
        ->assertJsonPath('data.iniciada_em', '2026-11-06T21:00:00Z')
        ->assertJsonPath('data.finalizada_em', '2026-11-06T21:38:10Z');
});

it('usa zero em acertos e erros quando a serie nao os informa', function () {
    $corpo = corpoDaSessao($this->treino, [
        'series' => [['exercicio_id' => $this->exercicio->id, 'numero' => 1]],
    ]);

    $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', $corpo)
        ->assertCreated()
        ->assertJsonPath('data.series.0.acertos', 0)
        ->assertJsonPath('data.series.0.erros', 0)
        ->assertJsonPath('data.series.0.repeticoes', null)
        ->assertJsonPath('data.series.0.duracao_segundos', null);
});

it('desfaz tudo quando a gravacao de uma serie falha', function () {
    SessaoSerie::creating(function () {
        throw new RuntimeException('falha forçada ao gravar a série');
    });

    $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', corpoDaSessao($this->treino))
        ->assertStatus(500);

    expect(Sessao::query()->count())->toBe(0)
        ->and(SessaoSerie::query()->count())->toBe(0);
});

it('devolve a mesma sessao no reenvio com o mesmo id_cliente, sem duplicar', function () {
    $corpo = corpoDaSessao($this->treino);

    $primeira = $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', $corpo)->assertCreated();
    $segunda = $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', $corpo)->assertOk();

    expect($segunda->json('data'))->toBe($primeira->json('data'))
        ->and(Sessao::query()->count())->toBe(1)
        ->and(SessaoSerie::query()->count())->toBe(2);
});

it('devolve a sessao no reenvio mesmo que o treino tenha sido excluido depois', function () {
    $corpo = corpoDaSessao($this->treino);

    $primeira = $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', $corpo)->assertCreated();

    $this->treino->delete();

    $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', $corpo)
        ->assertOk()
        ->assertJsonPath('data.id', $primeira->json('data.id'));
});

it('responde 422 em id_cliente ja usado por outro usuario, sem expor a sessao alheia', function () {
    $alheia = Sessao::factory()->create();

    $resposta = $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', corpoDaSessao($this->treino, [
        'id_cliente' => $alheia->id_cliente,
    ]));

    $resposta->assertStatus(422)->assertJsonValidationErrors(['id_cliente']);

    $resposta->assertJsonMissingPath('data');

    expect(array_keys($resposta->json()))->toEqualCanonicalizing(['message', 'errors', 'request_id'])
        ->and(json_encode($resposta->json()))->not->toContain($alheia->treino->nome)
        ->and(Sessao::query()->count())->toBe(1);
});

it('responde 404 para treino privado de outro usuario, excluido ou inexistente', function (string $caso) {
    $outro = User::factory()->create();
    $exercicio = Exercicio::factory()->create();
    $treino = Treino::factory()->for($outro, 'autor')->create();
    $treino->itens()->create(['exercicio_id' => $exercicio->id, 'etapa' => 'tecnica', 'ordem' => 1, 'series' => 1, 'repeticoes' => 5, 'descanso_segundos' => 30]);

    $corpo = corpoDaSessao($treino);

    if ($caso === 'excluido') {
        $treino = Treino::factory()->for($this->usuario, 'autor')->create();
        $treino->itens()->create(['exercicio_id' => $exercicio->id, 'etapa' => 'tecnica', 'ordem' => 1, 'series' => 1, 'repeticoes' => 5, 'descanso_segundos' => 30]);
        $corpo = corpoDaSessao($treino);
        $treino->delete();
    }

    if ($caso === 'inexistente') {
        $corpo['treino_id'] = 999999;
    }

    $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', $corpo)
        ->assertNotFound()
        ->assertJsonPath('message', 'Recurso não encontrado.');

    expect(Sessao::query()->count())->toBe(0);
})->with(['privado de outro usuario', 'excluido', 'inexistente']);

it('aceita treino visivel para atletas quando o usuario e atleta do autor, e treino publico de qualquer autor', function (string $visibilidade) {
    $treinador = User::factory()->treinador()->create();
    $this->usuario->treinador()->associate($treinador)->save();

    $autor = $visibilidade === 'publico' ? User::factory()->admin()->create() : $treinador;
    $treino = Treino::factory()->for($autor, 'autor')->create(['visibilidade' => $visibilidade]);
    $treino->itens()->create(['exercicio_id' => $this->exercicio->id, 'etapa' => 'tecnica', 'ordem' => 1, 'series' => 1, 'repeticoes' => 5, 'descanso_segundos' => 30]);

    $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', corpoDaSessao($treino))
        ->assertCreated()
        ->assertJsonPath('data.treino.id', $treino->id);
})->with(['atletas', 'publico']);

it('responde 404 para treino de atletas quando o usuario nao e atleta do autor', function () {
    $treinador = User::factory()->treinador()->create();
    $treino = Treino::factory()->for($treinador, 'autor')->paraAtletas()->create();
    $treino->itens()->create(['exercicio_id' => $this->exercicio->id, 'etapa' => 'tecnica', 'ordem' => 1, 'series' => 1, 'repeticoes' => 5, 'descanso_segundos' => 30]);

    $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', corpoDaSessao($treino))
        ->assertNotFound();
});

it('aceita serie de exercicio excluido da biblioteca que esta no treino, com o selo removido', function () {
    $this->exercicio->delete();

    $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', corpoDaSessao($this->treino))
        ->assertCreated()
        ->assertJsonPath('data.series.0.exercicio.id', $this->exercicio->id)
        ->assertJsonPath('data.series.0.exercicio.removido', true)
        ->assertJsonPath('data.series.0.fundamento', 'recepcao');
});

it('responde 422 para exercicio que nao pertence ao treino, no campo da serie', function () {
    $fora = Exercicio::factory()->create();

    $corpo = corpoDaSessao($this->treino);
    $corpo['series'][1]['exercicio_id'] = $fora->id;

    $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', $corpo)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['series.1.exercicio_id'])
        ->assertJsonMissingValidationErrors(['series.0.exercicio_id']);

    expect(Sessao::query()->count())->toBe(0);
});

it('responde 422 para corpo invalido', function (array $sobrescrever, string $campo) {
    $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', corpoDaSessao($this->treino, $sobrescrever))
        ->assertStatus(422)
        ->assertJsonValidationErrors([$campo]);

    expect(Sessao::query()->count())->toBe(0);
})->with([
    'series vazia' => [['series' => []], 'series'],
    'id_cliente nao uuid' => [['id_cliente' => 'abc'], 'id_cliente'],
    'id_cliente ausente' => [['id_cliente' => null], 'id_cliente'],
    'finalizada antes de iniciada' => [['finalizada_em' => '2026-11-06T20:59:59Z'], 'finalizada_em'],
    'data sem fuso' => [['iniciada_em' => '2026-11-06 21:00:00'], 'iniciada_em'],
    'finalizada no futuro' => [['iniciada_em' => now()->addHour()->toIso8601String(), 'finalizada_em' => now()->addHour()->toIso8601String()], 'finalizada_em'],
    'origem invalida' => [['origem' => 'outra'], 'origem'],
    'origem registro_rapido ainda nao aceita' => [['origem' => 'registro_rapido'], 'origem'],
    'treino_id ausente' => [['treino_id' => null], 'treino_id'],
    'duracao negativa' => [['duracao_segundos' => -1], 'duracao_segundos'],
    'duracao acima do teto' => [['duracao_segundos' => 86401], 'duracao_segundos'],
    'observacao longa' => [['observacao' => str_repeat('a', 1001)], 'observacao'],
    'acertos negativo' => [['series' => [['exercicio_id' => 1, 'numero' => 1, 'acertos' => -1]]], 'series.0.acertos'],
    'erros acima do teto' => [['series' => [['exercicio_id' => 1, 'numero' => 1, 'erros' => 1000]]], 'series.0.erros'],
    'numero zero' => [['series' => [['exercicio_id' => 1, 'numero' => 0]]], 'series.0.numero'],
    'exercicio_id ausente na serie' => [['series' => [['numero' => 1]]], 'series.0.exercicio_id'],
]);

it('responde 422 quando repete o par exercicio e numero', function () {
    $corpo = corpoDaSessao($this->treino);
    $corpo['series'][1]['numero'] = 1;

    $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', $corpo)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['series.1.numero']);
});

it('ignora usuario_id e fundamento enviados pelo cliente', function () {
    $outro = User::factory()->create();
    $corpo = corpoDaSessao($this->treino);
    $corpo['usuario_id'] = $outro->id;
    $corpo['series'][0]['fundamento'] = 'saque';

    $resposta = $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', $corpo)->assertCreated();

    $sessao = Sessao::query()->findOrFail($resposta->json('data.id'));

    expect($sessao->usuario_id)->toBe($this->usuario->id)
        ->and($resposta->json('data.series.0.fundamento'))->toBe('recepcao');
});

it('responde 401 sem sessao', function () {
    $this->postJson('/api/v1/sessoes', corpoDaSessao($this->treino))
        ->assertUnauthorized()
        ->assertJsonPath('message', 'Não autenticado.');

    expect(Sessao::query()->count())->toBe(0);
});

it('aceita o maximo de 200 series e recusa 201', function () {
    TreinoItem::query()->where('treino_id', $this->treino->id)->update(['series' => 201]);

    $series = fn (int $quantidade): array => array_map(
        fn (int $numero): array => ['exercicio_id' => $this->exercicio->id, 'numero' => $numero],
        range(1, $quantidade),
    );

    $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', corpoDaSessao($this->treino, ['series' => $series(201)]))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['series']);

    $this->actingAs($this->usuario)->postJson('/api/v1/sessoes', corpoDaSessao($this->treino, ['series' => $series(200)]))
        ->assertCreated()
        ->assertJsonCount(200, 'data.series');
});
