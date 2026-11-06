<?php

use App\Enums\Etapa;
use App\Enums\Nivel;
use App\Enums\Visibilidade;
use App\Models\Exercicio;
use App\Models\Treino;
use App\Models\TreinoItem;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Schema;

it('tem as colunas de treinos e treino_itens do modelo de dados', function (string $tabela, string $coluna, string $tipo, bool $aceitaNulo) {
    $definicao = collect(Schema::getColumns($tabela))->firstWhere('name', $coluna);

    expect($definicao)->not->toBeNull()
        ->and($definicao['type'])->toBe($tipo)
        ->and($definicao['nullable'])->toBe($aceitaNulo);
})->with([
    'treinos.nome' => ['treinos', 'nome', 'character varying(120)', false],
    'treinos.descricao' => ['treinos', 'descricao', 'text', true],
    'treinos.nivel' => ['treinos', 'nivel', 'character varying(20)', false],
    'treinos.visibilidade' => ['treinos', 'visibilidade', 'character varying(20)', false],
    'treinos.autor_id' => ['treinos', 'autor_id', 'bigint', false],
    'treinos.duracao_estimada_minutos' => ['treinos', 'duracao_estimada_minutos', 'smallint', false],
    'treinos.created_at' => ['treinos', 'created_at', 'timestamp(0) without time zone', true],
    'treinos.updated_at' => ['treinos', 'updated_at', 'timestamp(0) without time zone', true],
    'treinos.deleted_at' => ['treinos', 'deleted_at', 'timestamp(0) without time zone', true],
    'treino_itens.treino_id' => ['treino_itens', 'treino_id', 'bigint', false],
    'treino_itens.exercicio_id' => ['treino_itens', 'exercicio_id', 'bigint', false],
    'treino_itens.etapa' => ['treino_itens', 'etapa', 'character varying(20)', false],
    'treino_itens.ordem' => ['treino_itens', 'ordem', 'smallint', false],
    'treino_itens.series' => ['treino_itens', 'series', 'smallint', false],
    'treino_itens.repeticoes' => ['treino_itens', 'repeticoes', 'smallint', true],
    'treino_itens.duracao_segundos' => ['treino_itens', 'duracao_segundos', 'integer', true],
    'treino_itens.descanso_segundos' => ['treino_itens', 'descanso_segundos', 'smallint', false],
]);

it('tem os indices e a unicidade de treinos e treino_itens', function () {
    expect(Schema::hasIndex('treinos', ['autor_id', 'visibilidade']))->toBeTrue()
        ->and(Schema::hasIndex('treino_itens', ['treino_id', 'etapa', 'ordem'], 'unique'))->toBeTrue()
        ->and(Schema::hasIndex('treino_itens', ['exercicio_id']))->toBeTrue();
});

it('nao tem timestamps em treino_itens', function () {
    $item = TreinoItem::factory()->create();

    expect(Schema::hasColumn('treino_itens', 'created_at'))->toBeFalse()
        ->and(Schema::hasColumn('treino_itens', 'updated_at'))->toBeFalse()
        ->and($item->usesTimestamps())->toBeFalse();

    $item->update(['series' => 5]);

    expect($item->fresh()->series)->toBe(5);
});

it('converte nivel, visibilidade e etapa para os enums', function () {
    $treino = Treino::factory()->create(['nivel' => 'intermediario', 'visibilidade' => 'atletas'])->fresh();
    $item = TreinoItem::factory()->for($treino)->create(['etapa' => 'volta_a_calma'])->fresh();

    expect($treino->nivel)->toBe(Nivel::Intermediario)
        ->and($treino->visibilidade)->toBe(Visibilidade::Atletas)
        ->and($treino->duracao_estimada_minutos)->toBeInt()
        ->and($item->etapa)->toBe(Etapa::VoltaACalma)
        ->and($item->ordem)->toBeInt()
        ->and($item->series)->toBeInt();

    $this->assertDatabaseHas('treino_itens', ['id' => $item->id, 'etapa' => 'volta_a_calma']);
});

it('liga treino, autor, itens e exercicio', function () {
    $autor = User::factory()->create();
    $treino = Treino::factory()->for($autor, 'autor')->create();
    $exercicio = Exercicio::factory()->create();
    $item = TreinoItem::factory()->for($treino)->for($exercicio)->create();

    expect($treino->autor->is($autor))->toBeTrue()
        ->and($autor->treinos()->pluck('id')->all())->toBe([$treino->id])
        ->and($treino->itens()->pluck('id')->all())->toBe([$item->id])
        ->and($item->treino->is($treino))->toBeTrue()
        ->and($item->exercicio->is($exercicio))->toBeTrue()
        ->and($exercicio->treinoItens()->pluck('id')->all())->toBe([$item->id]);
});

it('define o autor e o treino pela relacao, nunca por atribuicao em massa', function () {
    $autor = User::factory()->create();

    $treino = $autor->treinos()->create([
        'nome' => 'Recepção e saque',
        'descricao' => null,
        'nivel' => Nivel::Iniciante,
        'visibilidade' => Visibilidade::Privado,
        'duracao_estimada_minutos' => 30,
    ]);

    $item = $treino->itens()->create([
        'exercicio_id' => Exercicio::factory()->create()->id,
        'etapa' => Etapa::Aquecimento,
        'ordem' => 1,
        'series' => 2,
        'repeticoes' => null,
        'duracao_segundos' => 60,
        'descanso_segundos' => 30,
    ]);

    expect($treino->autor_id)->toBe($autor->id)
        ->and($item->treino_id)->toBe($treino->id)
        ->and((new Treino)->isFillable('autor_id'))->toBeFalse()
        ->and((new TreinoItem)->isFillable('treino_id'))->toBeFalse();
});

it('exclui o treino logicamente, preservando os itens, e a exclusao fisica apaga os itens', function () {
    $treino = Treino::factory()->create();
    $item = TreinoItem::factory()->for($treino)->create();

    $treino->delete();

    $this->assertSoftDeleted($treino);
    $this->assertDatabaseHas('treino_itens', ['id' => $item->id]);

    expect(Treino::query()->find($treino->id))->toBeNull();

    $treino->forceDelete();

    $this->assertDatabaseMissing('treinos', ['id' => $treino->id]);
    $this->assertDatabaseMissing('treino_itens', ['id' => $item->id]);
});

it('apaga os treinos e os itens quando a conta do autor e excluida', function () {
    $autor = User::factory()->create();
    $treino = Treino::factory()->for($autor, 'autor')->create();
    $item = TreinoItem::factory()->for($treino)->create();

    $autor->delete();

    $this->assertDatabaseMissing('treinos', ['id' => $treino->id]);
    $this->assertDatabaseMissing('treino_itens', ['id' => $item->id]);
    $this->assertDatabaseHas('exercicios', ['id' => $item->exercicio_id]);
});

it('mantem no item o exercicio excluido da biblioteca e barra a exclusao fisica dele', function () {
    $item = TreinoItem::factory()->create();
    $exercicio = $item->exercicio;

    $exercicio->delete();

    $doItem = $item->fresh()->exercicio;

    expect($doItem)->not->toBeNull()
        ->and($doItem->is($exercicio))->toBeTrue()
        ->and($doItem->trashed())->toBeTrue()
        ->and(fn () => $exercicio->forceDelete())->toThrow(QueryException::class, 'treino_itens');
});

it('nao repete a ordem na mesma etapa do mesmo treino', function () {
    $treino = Treino::factory()->create();

    TreinoItem::factory()->for($treino)->create(['etapa' => Etapa::Tecnica, 'ordem' => 1]);
    TreinoItem::factory()->for($treino)->create(['etapa' => Etapa::Aquecimento, 'ordem' => 1]);
    TreinoItem::factory()->create(['etapa' => Etapa::Tecnica, 'ordem' => 1]);

    expect(fn () => TreinoItem::factory()->for($treino)->create(['etapa' => Etapa::Tecnica, 'ordem' => 1]))
        ->toThrow(UniqueConstraintViolationException::class);
});

it('exige repeticoes ou duracao em cada item, pelo CHECK do banco', function (?int $repeticoes, ?int $duracao, bool $aceita) {
    $gravar = fn () => TreinoItem::factory()->create([
        'repeticoes' => $repeticoes,
        'duracao_segundos' => $duracao,
    ]);

    if ($aceita) {
        expect($gravar()->exists)->toBeTrue();

        return;
    }

    expect($gravar)->toThrow(QueryException::class, 'treino_itens_repeticoes_ou_duracao_check');
})->with([
    'so repeticoes' => [10, null, true],
    'so duracao' => [null, 30, true],
    'os dois' => [10, 30, true],
    'nenhum dos dois' => [null, null, false],
]);

it('numera a ordem dos itens da factory dentro da etapa do treino', function () {
    $treino = Treino::factory()->create();

    $lote = TreinoItem::factory()->count(3)->for($treino)->create(['etapa' => Etapa::Tecnica]);
    $avulso = TreinoItem::factory()->for($treino)->create(['etapa' => Etapa::Tecnica]);
    $outraEtapa = TreinoItem::factory()->for($treino)->create(['etapa' => Etapa::Aquecimento]);
    $outroTreino = TreinoItem::factory()->create(['etapa' => Etapa::Tecnica]);

    expect($lote->pluck('ordem')->all())->toBe([1, 2, 3])
        ->and($avulso->ordem)->toBe(4)
        ->and($outraEtapa->ordem)->toBe(1)
        ->and($outroTreino->ordem)->toBe(1);
});

it('cria treinos validos pela factory, com estados e itens', function () {
    $padrao = Treino::factory()->create();
    $comItens = Treino::factory()->comItens(3)->create();
    $itemPorTempo = TreinoItem::factory()->porDuracao(45)->create();

    expect($padrao->visibilidade)->toBe(Visibilidade::Privado)
        ->and($padrao->nivel)->toBeInstanceOf(Nivel::class)
        ->and($padrao->autor)->toBeInstanceOf(User::class)
        ->and(Treino::factory()->paraAtletas()->create()->visibilidade)->toBe(Visibilidade::Atletas)
        ->and(Treino::factory()->publico()->create()->visibilidade)->toBe(Visibilidade::Publico)
        ->and(Treino::factory()->trashed()->create()->trashed())->toBeTrue()
        ->and($comItens->itens()->orderBy('ordem')->pluck('ordem')->all())->toBe([1, 2, 3])
        ->and($itemPorTempo->repeticoes)->toBeNull()
        ->and($itemPorTempo->duracao_segundos)->toBe(45);
});
