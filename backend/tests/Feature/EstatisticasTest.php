<?php

use App\Enums\Fundamento;
use App\Models\Sessao;
use App\Models\SessaoSerie;
use App\Models\User;
use Illuminate\Support\Carbon;

const FUSO_SP_API = 'America/Sao_Paulo';

function sessaoDe(User $usuario, string $horarioLocal, int $duracaoSegundos, array $series = []): Sessao
{
    $inicio = Carbon::parse($horarioLocal, FUSO_SP_API);

    $sessao = Sessao::factory()->for($usuario, 'usuario')->registroRapido()->create([
        'iniciada_em' => $inicio->utc(),
        'finalizada_em' => $inicio->copy()->addSeconds($duracaoSegundos)->utc(),
        'duracao_segundos' => $duracaoSegundos,
    ]);

    foreach ($series as [$fundamento, $acertos, $erros]) {
        SessaoSerie::factory()->for($sessao)->semExercicio($fundamento)->create([
            'acertos' => $acertos,
            'erros' => $erros,
        ]);
    }

    return $sessao;
}

it('devolve as estatisticas da semana no formato do contrato', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-06 15:00', FUSO_SP_API));
    $usuario = User::factory()->create();
    sessaoDe($usuario, '2026-11-02 07:00', 2700, [[Fundamento::Recepcao, 42, 18]]);
    sessaoDe($usuario, '2026-11-04 19:30', 3600, [[Fundamento::Saque, 15, 5]]);

    $resposta = $this->actingAs($usuario)->getJson('/api/v1/estatisticas?periodo=semana');

    $resposta->assertOk()->assertExactJson([
        'data' => [
            'periodo' => 'semana',
            'fuso' => 'America/Sao_Paulo',
            'inicio' => '2026-11-02',
            'fim' => '2026-11-08',
            'volume' => [
                'granularidade' => 'dia',
                'total_minutos' => 105,
                'pontos' => [
                    ['inicio' => '2026-11-02', 'minutos' => 45],
                    ['inicio' => '2026-11-03', 'minutos' => 0],
                    ['inicio' => '2026-11-04', 'minutos' => 60],
                    ['inicio' => '2026-11-05', 'minutos' => 0],
                    ['inicio' => '2026-11-06', 'minutos' => 0],
                    ['inicio' => '2026-11-07', 'minutos' => 0],
                    ['inicio' => '2026-11-08', 'minutos' => 0],
                ],
            ],
            'desempenho' => [
                ['fundamento' => 'recepcao', 'acertos' => 42, 'erros' => 18, 'tentativas' => 60, 'percentual' => 70.0],
                ['fundamento' => 'levantamento', 'acertos' => 0, 'erros' => 0, 'tentativas' => 0, 'percentual' => null],
                ['fundamento' => 'ataque', 'acertos' => 0, 'erros' => 0, 'tentativas' => 0, 'percentual' => null],
                ['fundamento' => 'saque', 'acertos' => 15, 'erros' => 5, 'tentativas' => 20, 'percentual' => 75.0],
                ['fundamento' => 'bloqueio', 'acertos' => 0, 'erros' => 0, 'tentativas' => 0, 'percentual' => null],
                ['fundamento' => 'defesa', 'acertos' => 0, 'erros' => 0, 'tentativas' => 0, 'percentual' => null],
                ['fundamento' => 'preparo_fisico', 'acertos' => 0, 'erros' => 0, 'tentativas' => 0, 'percentual' => null],
            ],
            'frequencia' => [
                'semana_inicio' => '2026-11-02',
                'semana_fim' => '2026-11-08',
                'dias_treinados' => 2,
                'meta' => 3,
                'datas' => ['2026-11-02', '2026-11-04'],
            ],
        ],
    ]);

    // Percentual sai como numero com casa decimal, e null nunca vira 0.
    expect($resposta->getContent())
        ->toContain('"percentual":70.0')
        ->toContain('"percentual":null');
});

it('aceita os quatro periodos e devolve o numero de pontos de cada um', function (string $periodo, string $granularidade, int $pontos) {
    Carbon::setTestNow(Carbon::parse('2026-11-06 15:00', FUSO_SP_API));
    $usuario = User::factory()->treinador()->create();

    $this->actingAs($usuario)->getJson("/api/v1/estatisticas?periodo={$periodo}")
        ->assertOk()
        ->assertJsonPath('data.periodo', $periodo)
        ->assertJsonPath('data.volume.granularidade', $granularidade)
        ->assertJsonCount($pontos, 'data.volume.pontos')
        ->assertJsonCount(7, 'data.desempenho');
})->with([
    'semana' => ['semana', 'dia', 7],
    'mes' => ['mes', 'semana', 4],
    '3meses' => ['3meses', 'semana', 13],
    'ano' => ['ano', 'mes', 12],
]);

it('responde 422 sem periodo', function () {
    $usuario = User::factory()->create();

    $this->actingAs($usuario)->getJson('/api/v1/estatisticas')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['periodo' => 'Informe um período válido: semana, mes, 3meses ou ano.'])
        ->assertJsonStructure(['message', 'errors', 'request_id']);
});

it('responde 422 com periodo invalido', function (string $periodo) {
    $usuario = User::factory()->create();

    $this->actingAs($usuario)->getJson('/api/v1/estatisticas?periodo='.$periodo)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['periodo' => 'Informe um período válido: semana, mes, 3meses ou ano.']);
})->with(['dia', 'SEMANA', '6meses', '1']);

it('responde 401 sem login', function () {
    $this->getJson('/api/v1/estatisticas?periodo=semana')
        ->assertUnauthorized()
        ->assertJsonPath('message', 'Não autenticado.')
        ->assertJsonStructure(['message', 'request_id']);
});

it('nao mistura as sessoes de outro usuario', function () {
    Carbon::setTestNow(Carbon::parse('2026-11-06 15:00', FUSO_SP_API));
    $usuario = User::factory()->create();
    $outro = User::factory()->create(['meta_semanal' => 7]);
    sessaoDe($usuario, '2026-11-02 07:00', 1800, [[Fundamento::Ataque, 10, 0]]);
    sessaoDe($outro, '2026-11-02 07:00', 3600, [[Fundamento::Ataque, 0, 10], [Fundamento::Saque, 5, 5]]);
    sessaoDe($outro, '2026-11-05 07:00', 3600);

    $this->actingAs($usuario)->getJson('/api/v1/estatisticas?periodo=semana')
        ->assertOk()
        ->assertJsonPath('data.volume.total_minutos', 30)
        ->assertJsonPath('data.desempenho.2', ['fundamento' => 'ataque', 'acertos' => 10, 'erros' => 0, 'tentativas' => 10, 'percentual' => 100.0])
        ->assertJsonPath('data.desempenho.3.percentual', null)
        ->assertJsonPath('data.frequencia.dias_treinados', 1)
        ->assertJsonPath('data.frequencia.meta', 3);
});
