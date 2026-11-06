<?php

use App\Enums\Fundamento;
use App\Enums\PeriodoEstatistica;
use App\Models\Sessao;
use App\Models\SessaoSerie;
use App\Models\User;
use App\Services\EstatisticasService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

const FUSO_SP = 'America/Sao_Paulo';

/**
 * Cria uma sessão do usuário começando no horário local de São Paulo informado.
 */
function sessaoEm(User $usuario, string $horarioLocal, int $duracaoSegundos = 1800, ?string $fuso = FUSO_SP): Sessao
{
    $inicio = Carbon::parse($horarioLocal, $fuso);

    return Sessao::factory()->for($usuario, 'usuario')->registroRapido()->create([
        'iniciada_em' => $inicio->utc(),
        'finalizada_em' => $inicio->copy()->addSeconds($duracaoSegundos)->utc(),
        'duracao_segundos' => $duracaoSegundos,
    ]);
}

function serieDe(Sessao $sessao, Fundamento $fundamento, int $acertos, int $erros): SessaoSerie
{
    return SessaoSerie::factory()->for($sessao)->semExercicio($fundamento)->create([
        'acertos' => $acertos,
        'erros' => $erros,
    ]);
}

function calcular(User $usuario, PeriodoEstatistica $periodo): array
{
    return app(EstatisticasService::class)->calcular($usuario, $periodo);
}

it('nao conta na semana atual a sessao de domingo a noite quando ja e segunda em Sao Paulo (RN-01)', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-09 00:10', FUSO_SP));
    $usuario = User::factory()->create();
    sessaoEm($usuario, '2026-11-08 23:50', 1800);

    $semana = calcular($usuario, PeriodoEstatistica::Semana);

    expect($semana['inicio'])->toBe('2026-11-09')
        ->and($semana['fim'])->toBe('2026-11-15')
        ->and($semana['volume']['total_minutos'])->toBe(0)
        ->and($semana['frequencia']['dias_treinados'])->toBe(0)
        ->and($semana['frequencia']['datas'])->toBe([]);

    $mes = calcular($usuario, PeriodoEstatistica::Mes);

    expect($mes['volume']['pontos'][2])->toBe(['inicio' => '2026-11-02', 'minutos' => 30])
        ->and($mes['volume']['pontos'][3])->toBe(['inicio' => '2026-11-09', 'minutos' => 0]);
});

it('coloca a sessao das 02:30 UTC de segunda no domingo local, no balde certo (RN-01)', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-08 23:45', FUSO_SP));
    $usuario = User::factory()->create();
    sessaoEm($usuario, '2026-11-09 02:30', 1200, 'UTC');

    $semana = calcular($usuario, PeriodoEstatistica::Semana);

    expect($semana['inicio'])->toBe('2026-11-02')
        ->and($semana['volume']['total_minutos'])->toBe(20)
        ->and($semana['volume']['pontos'][6])->toBe(['inicio' => '2026-11-08', 'minutos' => 20])
        ->and($semana['frequencia']['datas'])->toBe(['2026-11-08'])
        ->and($semana['frequencia']['dias_treinados'])->toBe(1);
});

it('devolve pontos completos com zero, percentuais null e frequencia zero quando nao ha sessoes', function (PeriodoEstatistica $periodo, int $pontos) {
    Carbon::setTestNow(Carbon::parse('2026-11-06 15:00', FUSO_SP));
    $usuario = User::factory()->create();

    $estatisticas = calcular($usuario, $periodo);

    expect($estatisticas['volume']['pontos'])->toHaveCount($pontos)
        ->and(collect($estatisticas['volume']['pontos'])->pluck('minutos')->unique()->all())->toBe([0])
        ->and($estatisticas['volume']['total_minutos'])->toBe(0)
        ->and($estatisticas['desempenho'])->toHaveCount(7)
        ->and(collect($estatisticas['desempenho'])->pluck('percentual')->unique()->all())->toBe([null])
        ->and(collect($estatisticas['desempenho'])->pluck('tentativas')->unique()->all())->toBe([0])
        ->and($estatisticas['frequencia']['dias_treinados'])->toBe(0)
        ->and($estatisticas['frequencia']['meta'])->toBe(3)
        ->and($estatisticas['frequencia']['datas'])->toBe([]);
})->with([
    'semana' => [PeriodoEstatistica::Semana, 7],
    'mes' => [PeriodoEstatistica::Mes, 4],
    '3meses' => [PeriodoEstatistica::TresMeses, 13],
    'ano' => [PeriodoEstatistica::Ano, 12],
]);

it('usa a granularidade, a janela e o numero de pontos de cada periodo (RN-03)', function (PeriodoEstatistica $periodo, string $granularidade, string $inicio, string $fim, int $pontos, string $segundoPonto) {
    Carbon::setTestNow(Carbon::parse('2026-11-06 15:00', FUSO_SP));
    $usuario = User::factory()->create();

    $estatisticas = calcular($usuario, $periodo);

    expect($estatisticas['periodo'])->toBe($periodo->value)
        ->and($estatisticas['fuso'])->toBe(FUSO_SP)
        ->and($estatisticas['inicio'])->toBe($inicio)
        ->and($estatisticas['fim'])->toBe($fim)
        ->and($estatisticas['volume']['granularidade'])->toBe($granularidade)
        ->and($estatisticas['volume']['pontos'])->toHaveCount($pontos)
        ->and($estatisticas['volume']['pontos'][0]['inicio'])->toBe($inicio)
        ->and($estatisticas['volume']['pontos'][1]['inicio'])->toBe($segundoPonto);
})->with([
    'semana' => [PeriodoEstatistica::Semana, 'dia', '2026-11-02', '2026-11-08', 7, '2026-11-03'],
    'mes' => [PeriodoEstatistica::Mes, 'semana', '2026-10-12', '2026-11-08', 4, '2026-10-19'],
    '3meses' => [PeriodoEstatistica::TresMeses, 'semana', '2026-08-10', '2026-11-08', 13, '2026-08-17'],
    'ano' => [PeriodoEstatistica::Ano, 'mes', '2025-12-01', '2026-11-30', 12, '2026-01-01'],
]);

it('soma o volume por balde em minutos, com baldes vazios em zero', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-06 15:00', FUSO_SP));
    $usuario = User::factory()->create();
    sessaoEm($usuario, '2026-11-02 07:00', 2700);
    sessaoEm($usuario, '2026-11-02 19:00', 630);
    sessaoEm($usuario, '2026-11-04 20:00', 3600);
    sessaoEm($usuario, '2026-11-01 10:00', 3600);

    $semana = calcular($usuario, PeriodoEstatistica::Semana);

    expect($semana['volume']['pontos'])->toBe([
        ['inicio' => '2026-11-02', 'minutos' => 56],
        ['inicio' => '2026-11-03', 'minutos' => 0],
        ['inicio' => '2026-11-04', 'minutos' => 60],
        ['inicio' => '2026-11-05', 'minutos' => 0],
        ['inicio' => '2026-11-06', 'minutos' => 0],
        ['inicio' => '2026-11-07', 'minutos' => 0],
        ['inicio' => '2026-11-08', 'minutos' => 0],
    ])->and($semana['volume']['total_minutos'])->toBe(116);

    $mes = calcular($usuario, PeriodoEstatistica::Mes);

    expect(collect($mes['volume']['pontos'])->pluck('minutos', 'inicio')->all())->toBe([
        '2026-10-12' => 0,
        '2026-10-19' => 0,
        '2026-10-26' => 60,
        '2026-11-02' => 116,
    ]);

    $ano = calcular($usuario, PeriodoEstatistica::Ano);

    expect($ano['volume']['pontos'][11])->toBe(['inicio' => '2026-11-01', 'minutos' => 176])
        ->and($ano['volume']['total_minutos'])->toBe(176);
});

it('calcula o percentual de acerto por fundamento, com null sem tentativas e 0.0 so com erros (RN-02)', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-06 15:00', FUSO_SP));
    $usuario = User::factory()->create();
    $segunda = sessaoEm($usuario, '2026-11-02 07:00');
    $quarta = sessaoEm($usuario, '2026-11-04 19:30');
    $foraDaJanela = sessaoEm($usuario, '2026-11-01 10:00');
    serieDe($segunda, Fundamento::Recepcao, 20, 10);
    serieDe($quarta, Fundamento::Recepcao, 22, 8);
    serieDe($quarta, Fundamento::Bloqueio, 0, 5);
    serieDe($quarta, Fundamento::Ataque, 2, 1);
    serieDe($foraDaJanela, Fundamento::Saque, 10, 0);

    $desempenho = collect(calcular($usuario, PeriodoEstatistica::Semana)['desempenho'])->keyBy('fundamento');

    expect($desempenho->keys()->all())->toBe(['recepcao', 'levantamento', 'ataque', 'saque', 'bloqueio', 'defesa', 'preparo_fisico'])
        ->and($desempenho['recepcao'])->toBe(['fundamento' => 'recepcao', 'acertos' => 42, 'erros' => 18, 'tentativas' => 60, 'percentual' => 70.0])
        ->and($desempenho['bloqueio'])->toBe(['fundamento' => 'bloqueio', 'acertos' => 0, 'erros' => 5, 'tentativas' => 5, 'percentual' => 0.0])
        ->and($desempenho['ataque']['percentual'])->toBe(66.7)
        ->and($desempenho['saque'])->toBe(['fundamento' => 'saque', 'acertos' => 0, 'erros' => 0, 'tentativas' => 0, 'percentual' => null])
        ->and($desempenho['levantamento']['percentual'])->toBeNull();
});

it('conta dias distintos da semana atual contra a meta do usuario, em qualquer periodo (RN-04)', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-06 15:00', FUSO_SP));
    $usuario = User::factory()->create(['meta_semanal' => 5]);
    sessaoEm($usuario, '2026-11-02 07:00');
    sessaoEm($usuario, '2026-11-02 21:30');
    sessaoEm($usuario, '2026-11-04 19:30');
    sessaoEm($usuario, '2026-10-30 19:30');

    foreach (PeriodoEstatistica::cases() as $periodo) {
        expect(calcular($usuario, $periodo)['frequencia'])->toBe([
            'semana_inicio' => '2026-11-02',
            'semana_fim' => '2026-11-08',
            'dias_treinados' => 2,
            'meta' => 5,
            'datas' => ['2026-11-02', '2026-11-04'],
        ]);
    }
});

it('faz sempre tres consultas, qualquer que seja o numero de sessoes', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-06 15:00', FUSO_SP));
    $usuario = User::factory()->create();

    foreach (range(0, 59) as $i) {
        $sessao = sessaoEm($usuario, '2026-11-02 07:00', 600 + $i);
        serieDe($sessao, Fundamento::cases()[$i % 7], 5, 2);
    }

    $servico = app(EstatisticasService::class);

    DB::flushQueryLog();
    DB::enableQueryLog();
    $estatisticas = $servico->calcular($usuario, PeriodoEstatistica::TresMeses);
    $consultas = count(DB::getQueryLog());
    DB::disableQueryLog();

    expect($consultas)->toBe(3)
        ->and($estatisticas['frequencia']['dias_treinados'])->toBe(1);
});
