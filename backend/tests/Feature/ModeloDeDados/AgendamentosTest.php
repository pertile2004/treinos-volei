<?php

use App\Models\Agendamento;
use App\Models\Sessao;
use App\Models\SessaoSerie;
use App\Models\Treino;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

it('tem as colunas de agendamentos do modelo de dados', function (string $coluna, string $tipo, bool $aceitaNulo) {
    $definicao = collect(Schema::getColumns('agendamentos'))->firstWhere('name', $coluna);

    expect($definicao)->not->toBeNull()
        ->and($definicao['type'])->toBe($tipo)
        ->and($definicao['nullable'])->toBe($aceitaNulo);
})->with([
    'usuario_id' => ['usuario_id', 'bigint', false],
    'treino_id' => ['treino_id', 'bigint', false],
    'data' => ['data', 'date', false],
    'hora' => ['hora', 'time(0) without time zone', true],
    'sessao_id' => ['sessao_id', 'bigint', true],
    'created_at' => ['created_at', 'timestamp(0) without time zone', true],
    'updated_at' => ['updated_at', 'timestamp(0) without time zone', true],
]);

it('tem os indices de agendamentos', function () {
    expect(Schema::hasIndex('agendamentos', ['usuario_id', 'data']))->toBeTrue()
        ->and(Schema::hasIndex('agendamentos', ['treino_id']))->toBeTrue()
        ->and(Schema::hasIndex('agendamentos', ['sessao_id']))->toBeTrue();
});

it('converte a data e guarda a hora como texto', function () {
    $agendamento = Agendamento::factory()->create(['data' => '2026-11-09', 'hora' => '18:30'])->fresh();
    $semHora = Agendamento::factory()->semHora()->create()->fresh();

    expect($agendamento->data)->toBeInstanceOf(Carbon::class)
        ->and($agendamento->data->toDateString())->toBe('2026-11-09')
        ->and($agendamento->hora)->toBe('18:30:00')
        ->and($semHora->hora)->toBeNull();
});

it('liga agendamento, usuario, treino e sessao', function () {
    $usuario = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create();
    $sessao = Sessao::factory()->for($usuario, 'usuario')->for($treino)->create();
    $agendamento = Agendamento::factory()->for($usuario, 'usuario')->for($treino)->for($sessao)->create();

    expect($agendamento->usuario->is($usuario))->toBeTrue()
        ->and($agendamento->treino->is($treino))->toBeTrue()
        ->and($agendamento->sessao->is($sessao))->toBeTrue()
        ->and($usuario->agendamentos()->pluck('id')->all())->toBe([$agendamento->id])
        ->and($treino->agendamentos()->pluck('id')->all())->toBe([$agendamento->id]);
});

it('cria o agendamento pelo usuario, nunca com dono ou sessao em massa', function () {
    $usuario = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create();

    $agendamento = $usuario->agendamentos()->create([
        'treino_id' => $treino->id,
        'data' => '2026-11-09',
        'hora' => null,
    ]);

    expect($agendamento->usuario_id)->toBe($usuario->id)
        ->and($agendamento->fresh()->sessao_id)->toBeNull()
        ->and((new Agendamento)->getFillable())->toEqualCanonicalizing(['treino_id', 'data', 'hora'])
        ->and((new Agendamento)->isFillable('usuario_id'))->toBeFalse()
        ->and((new Agendamento)->isFillable('sessao_id'))->toBeFalse();
});

it('mantem o agendamento do treino excluido logicamente e apaga com a exclusao fisica', function () {
    $agendamento = Agendamento::factory()->create();
    $treino = $agendamento->treino;

    $treino->delete();

    $mantido = $agendamento->fresh();

    expect($mantido)->not->toBeNull()
        ->and($mantido->treino->is($treino))->toBeTrue()
        ->and($mantido->treino->trashed())->toBeTrue();

    $treino->forceDelete();

    $this->assertDatabaseMissing('agendamentos', ['id' => $agendamento->id]);
});

it('volta a ficar pendente quando a sessao vinculada e apagada', function () {
    $agendamento = Agendamento::factory()->concluido()->create();
    $sessao = $agendamento->sessao;

    expect($sessao)->not->toBeNull()
        ->and($sessao->usuario_id)->toBe($agendamento->usuario_id)
        ->and($sessao->treino_id)->toBe($agendamento->treino_id);

    $sessao->delete();

    $pendente = $agendamento->fresh();

    expect($pendente)->not->toBeNull()
        ->and($pendente->sessao_id)->toBeNull();
});

it('exclui a conta com tudo o que e pessoal de uma vez e preserva o historico dos outros (RN-09)', function () {
    $usuario = User::factory()->create();
    $outro = User::factory()->create();

    $treino = Treino::factory()->for($usuario, 'autor')->comItens(2)->create();
    $sessao = Sessao::factory()->for($usuario, 'usuario')->for($treino)->create();
    SessaoSerie::factory()->count(2)->for($sessao)->create();
    Agendamento::factory()->for($usuario, 'usuario')->for($treino)->for($sessao)->create();
    Agendamento::factory()->for($usuario, 'usuario')->for($treino)->create();

    $sessaoDoOutro = Sessao::factory()->for($outro, 'usuario')->for($treino)->create();
    $serieDoOutro = SessaoSerie::factory()->for($sessaoDoOutro)->create();
    $agendamentoDoOutro = Agendamento::factory()->for($outro, 'usuario')->for($treino)->create();

    $usuario->delete();

    $this->assertDatabaseMissing('users', ['id' => $usuario->id]);
    $this->assertDatabaseMissing('treinos', ['id' => $treino->id]);
    $this->assertDatabaseMissing('treino_itens', ['treino_id' => $treino->id]);
    $this->assertDatabaseMissing('sessoes', ['usuario_id' => $usuario->id]);
    $this->assertDatabaseMissing('sessao_series', ['sessao_id' => $sessao->id]);
    $this->assertDatabaseMissing('agendamentos', ['usuario_id' => $usuario->id]);

    $this->assertDatabaseHas('users', ['id' => $outro->id]);
    $this->assertDatabaseHas('sessoes', ['id' => $sessaoDoOutro->id, 'treino_id' => null]);
    $this->assertDatabaseHas('sessao_series', ['id' => $serieDoOutro->id]);
    $this->assertDatabaseMissing('agendamentos', ['id' => $agendamentoDoOutro->id]);
});

it('cria agendamentos validos pela factory', function () {
    $pendente = Agendamento::factory()->create();
    $concluido = Agendamento::factory()->concluido()->create();

    expect($pendente->sessao_id)->toBeNull()
        ->and($pendente->treino->autor_id)->toBe($pendente->usuario_id)
        ->and($pendente->fresh()->hora)->toBe('18:00:00')
        ->and($concluido->sessao_id)->not->toBeNull();
});

it('usa o dia local de Sao Paulo como data padrao da factory (RN-01)', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-07T01:30:00Z'));

    $agendamento = Agendamento::factory()->create();

    expect($agendamento->data->toDateString())->toBe('2026-11-06');
});
