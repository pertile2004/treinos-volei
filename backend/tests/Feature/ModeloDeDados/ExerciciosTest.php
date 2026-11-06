<?php

use App\Enums\Fundamento;
use App\Enums\Nivel;
use App\Models\Exercicio;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

it('tem as colunas de exercicios do modelo de dados', function (string $coluna, string $tipo, bool $aceitaNulo) {
    $definicao = collect(Schema::getColumns('exercicios'))->firstWhere('name', $coluna);

    expect($definicao)->not->toBeNull()
        ->and($definicao['type'])->toBe($tipo)
        ->and($definicao['nullable'])->toBe($aceitaNulo);
})->with([
    'nome' => ['nome', 'character varying(120)', false],
    'descricao' => ['descricao', 'text', false],
    'foco' => ['foco', 'character varying(160)', true],
    'fundamento' => ['fundamento', 'character varying(20)', false],
    'nivel' => ['nivel', 'character varying(20)', false],
    'series_padrao' => ['series_padrao', 'smallint', false],
    'repeticoes_padrao' => ['repeticoes_padrao', 'smallint', true],
    'duracao_segundos_padrao' => ['duracao_segundos_padrao', 'integer', true],
    'descanso_segundos' => ['descanso_segundos', 'smallint', false],
    'video_url' => ['video_url', 'character varying(255)', true],
    'imagem_url' => ['imagem_url', 'character varying(255)', true],
    'criado_por' => ['criado_por', 'bigint', true],
    'created_at' => ['created_at', 'timestamp(0) without time zone', true],
    'updated_at' => ['updated_at', 'timestamp(0) without time zone', true],
    'deleted_at' => ['deleted_at', 'timestamp(0) without time zone', true],
]);

it('tem os indices de exercicios', function () {
    expect(Schema::hasIndex('exercicios', ['fundamento', 'nivel']))->toBeTrue()
        ->and(Schema::hasIndex('exercicios', ['criado_por']))->toBeTrue();
});

it('busca ignorando acentos e maiusculas com a extensao unaccent', function (string $termo) {
    Exercicio::factory()->create(['nome' => 'Recepção alta']);
    Exercicio::factory()->create(['nome' => 'RECEPÇÃO EM DUPLA']);
    Exercicio::factory()->create(['nome' => 'Saque flutuante']);

    $achados = Exercicio::query()
        ->whereRaw('lower(unaccent(nome)) like lower(unaccent(?))', ["%{$termo}%"])
        ->pluck('nome');

    expect($achados->all())->toEqualCanonicalizing(['Recepção alta', 'RECEPÇÃO EM DUPLA']);
})->with(['recepcao', 'RECEPÇÃO', 'Recepcao']);

it('usa 45 segundos de descanso por padrao, no banco e no model', function () {
    $id = DB::table('exercicios')->insertGetId([
        'nome' => 'Manchete na parede',
        'descricao' => 'Fique a 3 m da parede e devolva a bola em manchete.',
        'fundamento' => 'recepcao',
        'nivel' => 'iniciante',
        'series_padrao' => 3,
        'repeticoes_padrao' => 15,
    ]);

    expect(DB::table('exercicios')->where('id', $id)->value('descanso_segundos'))->toBe(45)
        ->and((new Exercicio)->descanso_segundos)->toBe(45);
});

it('converte fundamento e nivel para os enums e grava o valor em texto', function () {
    $exercicio = Exercicio::factory()->create([
        'fundamento' => Fundamento::PreparoFisico,
        'nivel' => 'avancado',
    ])->fresh();

    expect($exercicio->fundamento)->toBe(Fundamento::PreparoFisico)
        ->and($exercicio->nivel)->toBe(Nivel::Avancado)
        ->and($exercicio->series_padrao)->toBeInt()
        ->and($exercicio->descanso_segundos)->toBeInt();

    $this->assertDatabaseHas('exercicios', [
        'id' => $exercicio->id,
        'fundamento' => 'preparo_fisico',
        'nivel' => 'avancado',
    ]);
});

it('exclui logicamente: sai da consulta padrao e continua no banco', function () {
    $exercicio = Exercicio::factory()->create();

    $exercicio->delete();

    $this->assertSoftDeleted($exercicio);

    expect(Exercicio::query()->find($exercicio->id))->toBeNull()
        ->and(Exercicio::withTrashed()->find($exercicio->id)->trashed())->toBeTrue();

    $exercicio->restore();

    expect(Exercicio::query()->find($exercicio->id))->not->toBeNull();
});

it('liga o exercicio a quem criou e zera criado_por quando o criador e apagado', function () {
    $admin = User::factory()->admin()->create();
    $exercicio = Exercicio::factory()->for($admin, 'criador')->create();

    $chave = collect(Schema::getForeignKeys('exercicios'))->firstWhere('columns', ['criado_por']);

    expect($exercicio->criador->is($admin))->toBeTrue()
        ->and($chave['foreign_table'])->toBe('users')
        ->and($chave['on_delete'])->toBe('set null');

    $admin->delete();

    expect($exercicio->fresh())->not->toBeNull()
        ->and($exercicio->fresh()->criado_por)->toBeNull();
});

it('nao aceita criado_por em massa', function () {
    $exercicio = new Exercicio;

    expect($exercicio->getFillable())->toEqualCanonicalizing([
        'nome', 'descricao', 'foco', 'fundamento', 'nivel', 'series_padrao', 'repeticoes_padrao',
        'duracao_segundos_padrao', 'descanso_segundos', 'video_url', 'imagem_url',
    ])->and($exercicio->isFillable('criado_por'))->toBeFalse();
});

it('cria exercicios validos pela factory', function () {
    $padrao = Exercicio::factory()->create();

    expect($padrao->fundamento)->toBeInstanceOf(Fundamento::class)
        ->and($padrao->nivel)->toBeInstanceOf(Nivel::class)
        ->and($padrao->repeticoes_padrao)->toBeInt()
        ->and($padrao->duracao_segundos_padrao)->toBeNull()
        ->and($padrao->descanso_segundos)->toBe(45)
        ->and($padrao->video_url)->toBeNull()
        ->and($padrao->criado_por)->toBeNull();
});

it('oferece estados na factory de exercicios', function () {
    $saque = Exercicio::factory()->doFundamento(Fundamento::Saque)->doNivel(Nivel::Iniciante)->create();
    $porTempo = Exercicio::factory()->porDuracao(40)->create();
    $comVideo = Exercicio::factory()->comVideo('https://www.youtube.com/watch?v=VIDEO-DE-TESTE')->create();
    $excluido = Exercicio::factory()->trashed()->create();

    expect($saque->fundamento)->toBe(Fundamento::Saque)
        ->and($saque->nivel)->toBe(Nivel::Iniciante)
        ->and($porTempo->repeticoes_padrao)->toBeNull()
        ->and($porTempo->duracao_segundos_padrao)->toBe(40)
        ->and($comVideo->video_url)->toBe('https://www.youtube.com/watch?v=VIDEO-DE-TESTE')
        ->and($excluido->trashed())->toBeTrue();
});
