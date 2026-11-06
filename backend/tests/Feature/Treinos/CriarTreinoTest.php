<?php

use App\Enums\Etapa;
use App\Enums\Fundamento;
use App\Enums\Nivel;
use App\Enums\Visibilidade;
use App\Http\Resources\TreinoResource;
use App\Models\Exercicio;
use App\Models\Treino;
use App\Models\TreinoItem;
use App\Models\User;
use App\Services\TreinoService;
use Illuminate\Database\QueryException;

/**
 * Corpo válido com dois itens em etapas diferentes: um por duração e um por repetições.
 *
 * @param  array<string, mixed>  $sobrescrever
 * @return array<string, mixed>
 */
function corpoDeTreino(array $sobrescrever = []): array
{
    $porDuracao = Exercicio::factory()->porDuracao(60)->create();
    $porRepeticoes = Exercicio::factory()->create();

    return array_replace([
        'nome' => 'Recepção e saque',
        'descricao' => 'Foco em passe para o levantador.',
        'nivel' => Nivel::Intermediario->value,
        'visibilidade' => Visibilidade::Privado->value,
        'itens' => [
            [
                'exercicio_id' => $porDuracao->id,
                'etapa' => Etapa::Aquecimento->value,
                'ordem' => 1,
                'series' => 2,
                'repeticoes' => null,
                'duracao_segundos' => 60,
                'descanso_segundos' => 30,
            ],
            [
                'exercicio_id' => $porRepeticoes->id,
                'etapa' => Etapa::Tecnica->value,
                'ordem' => 1,
                'series' => 3,
                'repeticoes' => 10,
                'duracao_segundos' => null,
                'descanso_segundos' => 45,
            ],
        ],
    ], $sobrescrever);
}

/**
 * Usuário com o papel pedido (jogador é o padrão da factory).
 */
function usuarioComPapel(string $papel): User
{
    return match ($papel) {
        'treinador' => User::factory()->treinador()->create(),
        'admin' => User::factory()->admin()->create(),
        default => User::factory()->create(),
    };
}

/**
 * Um item válido por repetições, para montar listas e casos de limite.
 *
 * @param  array<string, mixed>  $sobrescrever
 * @return array<string, mixed>
 */
function itemDeTreino(array $sobrescrever = []): array
{
    return array_replace([
        'exercicio_id' => Exercicio::factory()->create()->id,
        'etapa' => Etapa::Tecnica->value,
        'ordem' => 1,
        'series' => 3,
        'repeticoes' => 10,
        'duracao_segundos' => null,
        'descanso_segundos' => 45,
    ], $sobrescrever);
}

it('cria o treino com os itens e responde 201 no formato do contrato', function () {
    $autor = User::factory()->create(['nome' => 'Lucas']);
    $outro = User::factory()->create();
    $corpo = corpoDeTreino();

    $resposta = $this->actingAs($autor)->postJson('/api/v1/treinos', $corpo + [
        'autor_id' => $outro->id,
        'duracao_estimada_minutos' => 999,
    ]);

    $resposta->assertCreated()
        ->assertJsonPath('data.nome', 'Recepção e saque')
        ->assertJsonPath('data.descricao', 'Foco em passe para o levantador.')
        ->assertJsonPath('data.nivel', 'intermediario')
        ->assertJsonPath('data.visibilidade', 'privado')
        ->assertJsonPath('data.duracao_estimada_minutos', 7)
        ->assertJsonPath('data.autor', ['id' => $autor->id, 'nome' => 'Lucas'])
        ->assertJsonCount(2, 'data.itens')
        ->assertJsonPath('data.itens.0.etapa', 'aquecimento')
        ->assertJsonPath('data.itens.0.ordem', 1)
        ->assertJsonPath('data.itens.0.series', 2)
        ->assertJsonPath('data.itens.0.repeticoes', null)
        ->assertJsonPath('data.itens.0.duracao_segundos', 60)
        ->assertJsonPath('data.itens.0.descanso_segundos', 30)
        ->assertJsonPath('data.itens.0.exercicio.id', $corpo['itens'][0]['exercicio_id'])
        ->assertJsonPath('data.itens.0.exercicio.removido', false)
        ->assertJsonPath('data.itens.1.etapa', 'tecnica')
        ->assertJsonPath('data.itens.1.repeticoes', 10)
        ->assertJsonPath('data.itens.1.duracao_segundos', null);

    expect(array_keys($resposta->json('data')))->toBe([
        'id', 'nome', 'descricao', 'nivel', 'visibilidade', 'duracao_estimada_minutos', 'autor', 'itens', 'criado_em',
    ])
        ->and(array_keys($resposta->json('data.itens.0')))->toBe([
            'id', 'etapa', 'ordem', 'series', 'repeticoes', 'duracao_segundos', 'descanso_segundos', 'exercicio',
        ])
        ->and(array_keys($resposta->json('data.itens.0.exercicio')))->toBe(['id', 'nome', 'fundamento', 'removido'])
        ->and($resposta->json('data.itens.0.exercicio.fundamento'))->toBeIn(array_column(Fundamento::cases(), 'value'))
        ->and($resposta->json('data.criado_em'))->toMatch('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/');

    $treino = Treino::query()->sole();

    expect($treino->autor_id)->toBe($autor->id)
        ->and($treino->duracao_estimada_minutos)->toBe(7)
        ->and($resposta->json('data.id'))->toBe($treino->id);

    $this->assertDatabaseCount('treino_itens', 2);
    $this->assertDatabaseHas('treino_itens', [
        'treino_id' => $treino->id,
        'exercicio_id' => $corpo['itens'][0]['exercicio_id'],
        'etapa' => 'aquecimento',
        'ordem' => 1,
        'series' => 2,
        'repeticoes' => null,
        'duracao_segundos' => 60,
        'descanso_segundos' => 30,
    ]);
    $this->assertDatabaseHas('treino_itens', [
        'treino_id' => $treino->id,
        'exercicio_id' => $corpo['itens'][1]['exercicio_id'],
        'etapa' => 'tecnica',
        'ordem' => 1,
        'repeticoes' => 10,
        'duracao_segundos' => null,
    ]);
});

it('devolve os itens na ordem das etapas e da posicao, nao na ordem do envio', function () {
    $autor = User::factory()->create();
    $corpo = corpoDeTreino(['itens' => [
        itemDeTreino(['etapa' => 'volta_a_calma', 'ordem' => 1]),
        itemDeTreino(['etapa' => 'tecnica', 'ordem' => 2]),
        itemDeTreino(['etapa' => 'aquecimento', 'ordem' => 1]),
        itemDeTreino(['etapa' => 'tecnica', 'ordem' => 1]),
    ]]);

    $resposta = $this->actingAs($autor)->postJson('/api/v1/treinos', $corpo);

    $resposta->assertCreated();

    expect(collect($resposta->json('data.itens'))->map(fn (array $item) => $item['etapa'].':'.$item['ordem'])->all())
        ->toBe(['aquecimento:1', 'tecnica:1', 'tecnica:2', 'volta_a_calma:1']);
});

it('aceita descricao nula', function () {
    $autor = User::factory()->create();

    $this->actingAs($autor)
        ->postJson('/api/v1/treinos', corpoDeTreino(['descricao' => null]))
        ->assertCreated()
        ->assertJsonPath('data.descricao', null);
});

it('responde 401 sem sessao e nao grava nada', function () {
    $resposta = $this->postJson('/api/v1/treinos', corpoDeTreino());

    $resposta->assertUnauthorized()
        ->assertJsonPath('message', 'Não autenticado.')
        ->assertJsonPath('request_id', $resposta->headers->get('X-Request-Id'));

    $this->assertDatabaseCount('treinos', 0);
});

it('aceita a visibilidade permitida para o papel', function (string $papel, string $visibilidade) {
    $autor = usuarioComPapel($papel);

    $this->actingAs($autor)
        ->postJson('/api/v1/treinos', corpoDeTreino(['visibilidade' => $visibilidade]))
        ->assertCreated()
        ->assertJsonPath('data.visibilidade', $visibilidade);

    $this->assertDatabaseHas('treinos', ['autor_id' => $autor->id, 'visibilidade' => $visibilidade]);
})->with([
    'jogador privado' => ['jogador', 'privado'],
    'treinador privado' => ['treinador', 'privado'],
    'treinador atletas' => ['treinador', 'atletas'],
    'admin privado' => ['admin', 'privado'],
    'admin atletas' => ['admin', 'atletas'],
    'admin publico' => ['admin', 'publico'],
]);

it('responde 422 para visibilidade fora do papel', function (string $papel, string $visibilidade) {
    $autor = usuarioComPapel($papel);

    $this->actingAs($autor)
        ->postJson('/api/v1/treinos', corpoDeTreino(['visibilidade' => $visibilidade]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['visibilidade' => 'A visibilidade escolhida não está disponível para o seu papel.']);

    $this->assertDatabaseCount('treinos', 0);
})->with([
    'jogador atletas' => ['jogador', 'atletas'],
    'jogador publico' => ['jogador', 'publico'],
    'treinador publico' => ['treinador', 'publico'],
]);

it('responde 422 para exercicio excluido da biblioteca ou inexistente', function () {
    $autor = User::factory()->create();
    $excluido = Exercicio::factory()->trashed()->create();
    $corpo = corpoDeTreino(['itens' => [
        itemDeTreino(['exercicio_id' => $excluido->id, 'ordem' => 1]),
        itemDeTreino(['exercicio_id' => 999999, 'ordem' => 2]),
    ]]);

    $this->actingAs($autor)
        ->postJson('/api/v1/treinos', $corpo)
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'itens.0.exercicio_id' => 'O exercício escolhido não existe ou foi removido da biblioteca.',
            'itens.1.exercicio_id' => 'O exercício escolhido não existe ou foi removido da biblioteca.',
        ]);

    $this->assertDatabaseCount('treinos', 0);
    $this->assertDatabaseCount('treino_itens', 0);
});

it('nao grava nada quando um item entre varios e invalido', function () {
    $autor = User::factory()->create();
    $corpo = corpoDeTreino();
    $corpo['itens'][] = itemDeTreino(['etapa' => 'especifico', 'series' => 0]);

    $this->actingAs($autor)
        ->postJson('/api/v1/treinos', $corpo)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['itens.2.series'])
        ->assertJsonMissingValidationErrors(['itens.0.series', 'itens.1.series']);

    $this->assertDatabaseCount('treinos', 0);
    $this->assertDatabaseCount('treino_itens', 0);
});

it('desfaz o treino quando a gravacao de um item falha no service', function () {
    $autor = User::factory()->create();
    $corpo = corpoDeTreino();
    // Mesma etapa e ordem do primeiro item: o único (treino_id, etapa, ordem) estoura ao gravar o segundo.
    $corpo['itens'][1]['etapa'] = $corpo['itens'][0]['etapa'];
    $corpo['itens'][1]['ordem'] = $corpo['itens'][0]['ordem'];

    $service = app(TreinoService::class);

    expect(fn () => $service->criar($autor, $corpo))->toThrow(QueryException::class);

    $this->assertDatabaseCount('treinos', 0);
    $this->assertDatabaseCount('treino_itens', 0);
});

it('responde 422 em cada limite do contrato', function (array $sobrescrever, string $campo, string $mensagem) {
    $autor = User::factory()->create();

    $this->actingAs($autor)
        ->postJson('/api/v1/treinos', corpoDeTreino($sobrescrever))
        ->assertUnprocessable()
        ->assertJsonValidationErrors([$campo => $mensagem]);

    $this->assertDatabaseCount('treinos', 0);
})->with([
    'nome vazio' => [['nome' => ''], 'nome', 'O campo nome é obrigatório.'],
    'nome com 121' => [['nome' => str_repeat('a', 121)], 'nome', 'O campo nome não pode ter mais de 120 caracteres.'],
    'descricao com 2001' => [['descricao' => str_repeat('a', 2001)], 'descricao', 'O campo descrição não pode ter mais de 2000 caracteres.'],
    'nivel invalido' => [['nivel' => 'mestre'], 'nivel', 'O valor selecionado para nível é inválido.'],
    'nivel ausente' => [['nivel' => null], 'nivel', 'O campo nível é obrigatório.'],
    'visibilidade ausente' => [['visibilidade' => null], 'visibilidade', 'O campo visibilidade é obrigatório.'],
    'sem itens' => [['itens' => []], 'itens', 'O campo itens é obrigatório.'],
    'itens nao e lista' => [['itens' => 'x'], 'itens', 'O campo itens deve ser uma lista de valores.'],
    // Os casos com item precisam do banco: ficam em closure, resolvida dentro do teste.
    'etapa invalida' => [fn () => ['itens' => [itemDeTreino(['etapa' => 'alongamento'])]], 'itens.0.etapa', 'O valor selecionado para etapa é inválido.'],
    'ordem 0' => [fn () => ['itens' => [itemDeTreino(['ordem' => 0])]], 'itens.0.ordem', 'O campo ordem deve ser no mínimo 1.'],
    'series 0' => [fn () => ['itens' => [itemDeTreino(['series' => 0])]], 'itens.0.series', 'O campo séries deve estar entre 1 e 10.'],
    'series 11' => [fn () => ['itens' => [itemDeTreino(['series' => 11])]], 'itens.0.series', 'O campo séries deve estar entre 1 e 10.'],
    'repeticoes 0' => [fn () => ['itens' => [itemDeTreino(['repeticoes' => 0])]], 'itens.0.repeticoes', 'O campo repetições deve estar entre 1 e 100.'],
    'repeticoes 101' => [fn () => ['itens' => [itemDeTreino(['repeticoes' => 101])]], 'itens.0.repeticoes', 'O campo repetições deve estar entre 1 e 100.'],
    'duracao 9' => [fn () => ['itens' => [itemDeTreino(['repeticoes' => null, 'duracao_segundos' => 9])]], 'itens.0.duracao_segundos', 'O campo duração deve estar entre 10 e 3600.'],
    'duracao 3601' => [fn () => ['itens' => [itemDeTreino(['repeticoes' => null, 'duracao_segundos' => 3601])]], 'itens.0.duracao_segundos', 'O campo duração deve estar entre 10 e 3600.'],
    'descanso -1' => [fn () => ['itens' => [itemDeTreino(['descanso_segundos' => -1])]], 'itens.0.descanso_segundos', 'O campo descanso deve estar entre 0 e 600.'],
    'descanso 601' => [fn () => ['itens' => [itemDeTreino(['descanso_segundos' => 601])]], 'itens.0.descanso_segundos', 'O campo descanso deve estar entre 0 e 600.'],
    'sem repeticoes nem duracao' => [fn () => ['itens' => [itemDeTreino(['repeticoes' => null, 'duracao_segundos' => null])]], 'itens.0.repeticoes', 'Informe repetições ou duração em cada exercício.'],
    'series nao inteira' => [fn () => ['itens' => [itemDeTreino(['series' => 'três'])]], 'itens.0.series', 'O campo séries deve ser um número inteiro.'],
    'exercicio ausente' => [fn () => ['itens' => [itemDeTreino(['exercicio_id' => null])]], 'itens.0.exercicio_id', 'O campo exercício é obrigatório.'],
]);

it('responde 422 com 31 itens', function () {
    $autor = User::factory()->create();
    $exercicio = Exercicio::factory()->create();
    $itens = collect(range(1, 31))
        ->map(fn (int $ordem) => itemDeTreino(['exercicio_id' => $exercicio->id, 'ordem' => $ordem]))
        ->all();

    $this->actingAs($autor)
        ->postJson('/api/v1/treinos', corpoDeTreino(['itens' => $itens]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['itens' => 'O campo itens não pode ter mais de 30 itens.']);

    $this->assertDatabaseCount('treinos', 0);
});

it('aceita 30 itens', function () {
    $autor = User::factory()->create();
    $exercicio = Exercicio::factory()->create();
    $itens = collect(range(1, 30))
        ->map(fn (int $ordem) => itemDeTreino(['exercicio_id' => $exercicio->id, 'ordem' => $ordem]))
        ->all();

    $this->actingAs($autor)
        ->postJson('/api/v1/treinos', corpoDeTreino(['itens' => $itens]))
        ->assertCreated()
        ->assertJsonCount(30, 'data.itens');

    $this->assertDatabaseCount('treino_itens', 30);
});

it('responde 422 quando a mesma etapa repete a ordem, sem erro do banco', function () {
    $autor = User::factory()->create();
    $corpo = corpoDeTreino(['itens' => [
        itemDeTreino(['etapa' => 'tecnica', 'ordem' => 1]),
        itemDeTreino(['etapa' => 'aquecimento', 'ordem' => 1]),
        itemDeTreino(['etapa' => 'tecnica', 'ordem' => 1]),
    ]]);

    $this->actingAs($autor)
        ->postJson('/api/v1/treinos', $corpo)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['itens.2.ordem' => 'A ordem 1 já está em uso na etapa Técnica.'])
        ->assertJsonMissingValidationErrors(['itens.0.ordem', 'itens.1.ordem']);

    $this->assertDatabaseCount('treinos', 0);
});

it('aceita repeticoes e duracao juntas no mesmo item', function () {
    $autor = User::factory()->create();

    $this->actingAs($autor)
        ->postJson('/api/v1/treinos', corpoDeTreino(['itens' => [itemDeTreino(['repeticoes' => 10, 'duracao_segundos' => 30])]]))
        ->assertCreated()
        ->assertJsonPath('data.itens.0.repeticoes', 10)
        ->assertJsonPath('data.itens.0.duracao_segundos', 30);
});

it('mantem o exercicio excluido depois da criacao e o marca como removido', function () {
    $autor = User::factory()->create();
    $corpo = corpoDeTreino();

    $id = $this->actingAs($autor)->postJson('/api/v1/treinos', $corpo)->assertCreated()->json('data.id');

    Exercicio::query()->findOrFail($corpo['itens'][0]['exercicio_id'])->delete();

    $treino = Treino::query()->with(['autor', 'itens.exercicio'])->findOrFail($id);
    $resource = (new TreinoResource($treino))->response()->getData(true)['data'];

    $porExercicio = collect($resource['itens'])->keyBy('exercicio.id');

    expect($porExercicio[$corpo['itens'][0]['exercicio_id']]['exercicio']['removido'])->toBeTrue()
        ->and($porExercicio[$corpo['itens'][0]['exercicio_id']]['exercicio']['nome'])->not->toBeEmpty()
        ->and($porExercicio[$corpo['itens'][1]['exercicio_id']]['exercicio']['removido'])->toBeFalse()
        ->and(TreinoItem::query()->where('treino_id', $id)->count())->toBe(2);
});
