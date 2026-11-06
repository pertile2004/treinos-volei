<?php

use App\Enums\Fundamento;
use App\Enums\OrigemSessao;
use App\Models\Exercicio;
use App\Models\Sessao;
use App\Models\SessaoSerie;
use App\Models\Treino;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

it('tem as colunas de sessoes e sessao_series do modelo de dados', function (string $tabela, string $coluna, string $tipo, bool $aceitaNulo) {
    $definicao = collect(Schema::getColumns($tabela))->firstWhere('name', $coluna);

    expect($definicao)->not->toBeNull()
        ->and($definicao['type'])->toBe($tipo)
        ->and($definicao['nullable'])->toBe($aceitaNulo);
})->with([
    'sessoes.usuario_id' => ['sessoes', 'usuario_id', 'bigint', false],
    'sessoes.treino_id' => ['sessoes', 'treino_id', 'bigint', true],
    'sessoes.origem' => ['sessoes', 'origem', 'character varying(20)', false],
    'sessoes.iniciada_em' => ['sessoes', 'iniciada_em', 'timestamp(0) with time zone', false],
    'sessoes.finalizada_em' => ['sessoes', 'finalizada_em', 'timestamp(0) with time zone', false],
    'sessoes.duracao_segundos' => ['sessoes', 'duracao_segundos', 'integer', false],
    'sessoes.observacao' => ['sessoes', 'observacao', 'text', true],
    'sessoes.id_cliente' => ['sessoes', 'id_cliente', 'uuid', true],
    'sessoes.created_at' => ['sessoes', 'created_at', 'timestamp(0) without time zone', true],
    'sessoes.updated_at' => ['sessoes', 'updated_at', 'timestamp(0) without time zone', true],
    'sessao_series.sessao_id' => ['sessao_series', 'sessao_id', 'bigint', false],
    'sessao_series.exercicio_id' => ['sessao_series', 'exercicio_id', 'bigint', true],
    'sessao_series.fundamento' => ['sessao_series', 'fundamento', 'character varying(20)', false],
    'sessao_series.numero' => ['sessao_series', 'numero', 'smallint', false],
    'sessao_series.repeticoes' => ['sessao_series', 'repeticoes', 'smallint', true],
    'sessao_series.acertos' => ['sessao_series', 'acertos', 'smallint', false],
    'sessao_series.erros' => ['sessao_series', 'erros', 'smallint', false],
    'sessao_series.duracao_segundos' => ['sessao_series', 'duracao_segundos', 'integer', true],
]);

it('tem os indices e a unicidade de sessoes e sessao_series', function () {
    expect(Schema::hasIndex('sessoes', ['usuario_id', 'iniciada_em']))->toBeTrue()
        ->and(Schema::hasIndex('sessoes', ['treino_id']))->toBeTrue()
        ->and(Schema::hasIndex('sessoes', ['id_cliente'], 'unique'))->toBeTrue()
        ->and(Schema::hasIndex('sessao_series', ['sessao_id']))->toBeTrue()
        ->and(Schema::hasIndex('sessao_series', ['fundamento']))->toBeTrue()
        ->and(Schema::hasIndex('sessao_series', ['exercicio_id']))->toBeTrue();
});

it('nao tem timestamps em sessao_series', function () {
    $serie = SessaoSerie::factory()->create();

    expect(Schema::hasColumn('sessao_series', 'created_at'))->toBeFalse()
        ->and(Schema::hasColumn('sessao_series', 'updated_at'))->toBeFalse()
        ->and($serie->usesTimestamps())->toBeFalse();

    $serie->update(['acertos' => 9]);

    expect($serie->fresh()->acertos)->toBe(9);
});

it('usa a sessao do banco em UTC', function () {
    expect(DB::scalar('show timezone'))
        ->toBe('UTC', "Falta 'timezone' => 'UTC' na conexao pgsql de config/database.php (veja o LEIAME).");
});

it('grava o mesmo instante, qualquer que seja o fuso recebido, e devolve em UTC', function (string $valor, ?string $fuso) {
    $recebido = $fuso === null ? $valor : Carbon::parse($valor, $fuso);

    $sessao = User::factory()->create()->sessoes()->create([
        'origem' => OrigemSessao::RegistroRapido,
        'iniciada_em' => $recebido,
        'finalizada_em' => $recebido,
        'duracao_segundos' => 0,
    ]);

    $segundosNoBanco = DB::table('sessoes')
        ->where('id', $sessao->id)
        ->selectRaw('extract(epoch from iniciada_em)::bigint as instante')
        ->value('instante');

    $lida = $sessao->fresh();

    expect($segundosNoBanco)->toBe(Carbon::parse('2026-11-06T21:00:00Z')->getTimestamp())
        ->and($sessao->iniciada_em->toIso8601ZuluString())->toBe('2026-11-06T21:00:00Z')
        ->and($lida->iniciada_em->toIso8601ZuluString())->toBe('2026-11-06T21:00:00Z')
        ->and($lida->finalizada_em->toIso8601ZuluString())->toBe('2026-11-06T21:00:00Z')
        ->and($lida->iniciada_em->utcOffset())->toBe(0);
})->with([
    'Carbon em UTC' => ['2026-11-06 21:00:00', 'UTC'],
    'Carbon em America/Sao_Paulo' => ['2026-11-06 18:00:00', 'America/Sao_Paulo'],
    'texto ISO com Z' => ['2026-11-06T21:00:00Z', null],
    'texto ISO com -03:00' => ['2026-11-06T18:00:00-03:00', null],
]);

it('compara instantes nas consultas', function () {
    $sessao = Sessao::factory()->create([
        'iniciada_em' => Carbon::parse('2026-11-06T21:00:00Z'),
        'duracao_segundos' => 600,
    ]);

    $aPartirDe = fn (string $instante) => Sessao::query()
        ->where('iniciada_em', '>=', Carbon::parse($instante))
        ->pluck('id')
        ->all();

    expect($aPartirDe('2026-11-06T20:59:59Z'))->toBe([$sessao->id])
        ->and($aPartirDe('2026-11-06T21:00:01Z'))->toBe([]);
});

it('converte origem, datas e fundamento pelos casts', function () {
    $sessao = Sessao::factory()->create(['origem' => 'registro_rapido', 'treino_id' => null])->fresh();
    $serie = SessaoSerie::factory()->for($sessao)->semExercicio(Fundamento::Defesa)->create()->fresh();

    expect($sessao->origem)->toBe(OrigemSessao::RegistroRapido)
        ->and($sessao->iniciada_em)->toBeInstanceOf(Carbon::class)
        ->and($sessao->finalizada_em)->toBeInstanceOf(Carbon::class)
        ->and($sessao->duracao_segundos)->toBeInt()
        ->and($serie->fundamento)->toBe(Fundamento::Defesa)
        ->and($serie->numero)->toBeInt()
        ->and($serie->acertos)->toBeInt();

    $this->assertDatabaseHas('sessoes', ['id' => $sessao->id, 'origem' => 'registro_rapido']);
    $this->assertDatabaseHas('sessao_series', ['id' => $serie->id, 'fundamento' => 'defesa']);
});

it('usa zero acertos e zero erros por padrao, no banco e no model', function () {
    $sessao = Sessao::factory()->create();

    $id = DB::table('sessao_series')->insertGetId([
        'sessao_id' => $sessao->id,
        'fundamento' => 'saque',
        'numero' => 1,
    ]);

    $linha = DB::table('sessao_series')->where('id', $id)->first();

    expect($linha->acertos)->toBe(0)
        ->and($linha->erros)->toBe(0)
        ->and((new SessaoSerie)->acertos)->toBe(0)
        ->and((new SessaoSerie)->erros)->toBe(0);
});

it('liga sessao, usuario, treino, series e exercicio', function () {
    $usuario = User::factory()->create();
    $treino = Treino::factory()->for($usuario, 'autor')->create();
    $exercicio = Exercicio::factory()->create();
    $sessao = Sessao::factory()->for($usuario, 'usuario')->for($treino)->create();
    $serie = SessaoSerie::factory()->for($sessao)->for($exercicio)->create();

    expect($sessao->usuario->is($usuario))->toBeTrue()
        ->and($sessao->treino->is($treino))->toBeTrue()
        ->and($sessao->series()->pluck('id')->all())->toBe([$serie->id])
        ->and($serie->sessao->is($sessao))->toBeTrue()
        ->and($serie->exercicio->is($exercicio))->toBeTrue()
        ->and($usuario->sessoes()->pluck('id')->all())->toBe([$sessao->id])
        ->and($treino->sessoes()->pluck('id')->all())->toBe([$sessao->id])
        ->and($exercicio->sessaoSeries()->pluck('id')->all())->toBe([$serie->id]);
});

it('grava a sessao pelo usuario e as series pela sessao, nunca por atribuicao em massa', function () {
    $usuario = User::factory()->create();
    $exercicio = Exercicio::factory()->doFundamento(Fundamento::Recepcao)->create();
    $idCliente = (string) Str::uuid();

    $sessao = $usuario->sessoes()->create([
        'treino_id' => null,
        'origem' => OrigemSessao::Cronometro,
        'iniciada_em' => '2026-11-06T21:00:00Z',
        'finalizada_em' => '2026-11-06T21:38:10Z',
        'duracao_segundos' => 2100,
        'observacao' => null,
        'id_cliente' => $idCliente,
    ]);

    $sessao->series()->createMany([
        ['exercicio_id' => $exercicio->id, 'fundamento' => $exercicio->fundamento, 'numero' => 1, 'repeticoes' => 10, 'acertos' => 7, 'erros' => 3, 'duracao_segundos' => 95],
        ['exercicio_id' => null, 'fundamento' => Fundamento::Saque, 'numero' => 2],
    ]);

    $series = $sessao->series()->orderBy('numero')->get();

    expect($sessao->usuario_id)->toBe($usuario->id)
        ->and($sessao->fresh()->id_cliente)->toBe($idCliente)
        ->and($series)->toHaveCount(2)
        ->and($series[0]->sessao_id)->toBe($sessao->id)
        ->and($series[0]->acertos)->toBe(7)
        ->and($series[1]->acertos)->toBe(0)
        ->and($series[1]->fundamento)->toBe(Fundamento::Saque)
        ->and((new Sessao)->isFillable('usuario_id'))->toBeFalse()
        ->and((new SessaoSerie)->isFillable('sessao_id'))->toBeFalse();
});

it('apaga as series com a sessao e as sessoes com a conta', function () {
    $usuario = User::factory()->create();
    $apagada = Sessao::factory()->for($usuario, 'usuario')->create();
    $restante = Sessao::factory()->for($usuario, 'usuario')->create();
    $serieDaApagada = SessaoSerie::factory()->for($apagada)->create();
    $serieDaRestante = SessaoSerie::factory()->for($restante)->create();

    $apagada->delete();

    $this->assertDatabaseMissing('sessao_series', ['id' => $serieDaApagada->id]);
    $this->assertDatabaseHas('sessao_series', ['id' => $serieDaRestante->id]);

    $usuario->delete();

    $this->assertDatabaseMissing('sessoes', ['id' => $restante->id]);
    $this->assertDatabaseMissing('sessao_series', ['id' => $serieDaRestante->id]);
});

it('mantem a sessao quando o treino e excluido: logicamente segue ligada, fisicamente fica sem treino', function () {
    $sessao = Sessao::factory()->create();
    $treino = $sessao->treino;

    $treino->delete();

    $ligada = $sessao->fresh();

    expect($ligada->treino_id)->toBe($treino->id)
        ->and($ligada->treino->trashed())->toBeTrue();

    $treino->forceDelete();

    $semTreino = $sessao->fresh();

    expect($semTreino)->not->toBeNull()
        ->and($semTreino->treino_id)->toBeNull()
        ->and($semTreino->treino)->toBeNull();
});

it('mantem a serie quando o exercicio some: logicamente segue ligada, fisicamente fica so com o fundamento', function () {
    $serie = SessaoSerie::factory()->create();
    $exercicio = $serie->exercicio;
    $fundamento = $serie->fundamento;

    $exercicio->delete();

    expect($serie->fresh()->exercicio->trashed())->toBeTrue();

    $exercicio->forceDelete();

    $semExercicio = $serie->fresh();

    expect($semExercicio)->not->toBeNull()
        ->and($semExercicio->exercicio_id)->toBeNull()
        ->and($semExercicio->exercicio)->toBeNull()
        ->and($semExercicio->fundamento)->toBe($fundamento);
});

it('nao repete id_cliente e aceita varias sessoes sem ele', function () {
    $idCliente = (string) Str::uuid();

    Sessao::factory()->create(['id_cliente' => $idCliente]);
    Sessao::factory()->count(2)->semIdCliente()->create();

    expect(Sessao::query()->whereNull('id_cliente')->count())->toBe(2)
        ->and(fn () => Sessao::factory()->create(['id_cliente' => $idCliente]))
        ->toThrow(UniqueConstraintViolationException::class);
});

it('cria sessoes validas pela factory', function () {
    $sessao = Sessao::factory()->create();
    $rapida = Sessao::factory()->registroRapido()->create();

    expect($sessao->origem)->toBe(OrigemSessao::Cronometro)
        ->and($sessao->treino->autor_id)->toBe($sessao->usuario_id)
        ->and(Str::isUuid($sessao->id_cliente))->toBeTrue()
        ->and($sessao->duracao_segundos)->toBeGreaterThan(0)
        ->and((int) $sessao->iniciada_em->diffInSeconds($sessao->finalizada_em))->toBe($sessao->duracao_segundos)
        ->and($rapida->origem)->toBe(OrigemSessao::RegistroRapido)
        ->and($rapida->treino_id)->toBeNull();
});

it('cria series validas pela factory, com o fundamento do exercicio', function () {
    $exercicio = Exercicio::factory()->doFundamento(Fundamento::Bloqueio)->create();
    $serie = SessaoSerie::factory()->for($exercicio)->create();
    $semExercicio = SessaoSerie::factory()->semExercicio(Fundamento::Saque)->create();

    expect($serie->fundamento)->toBe(Fundamento::Bloqueio)
        ->and($serie->numero)->toBe(1)
        ->and($serie->acertos + $serie->erros)->toBeLessThanOrEqual($serie->repeticoes)
        ->and($semExercicio->exercicio_id)->toBeNull()
        ->and($semExercicio->fundamento)->toBe(Fundamento::Saque);
});
