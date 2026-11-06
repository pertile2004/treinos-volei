<?php

use App\Services\TreinoService;

it('estima a duracao em minutos, arredondando para cima', function (array $itens, int $minutos) {
    expect((new TreinoService)->estimarDuracaoMinutos($itens))->toBe($minutos);
})->with([
    // 2 séries × 60 s + 2 × 30 s de descanso = 180 s → 3 min
    'so por duracao' => [[
        ['series' => 2, 'repeticoes' => null, 'duracao_segundos' => 60, 'descanso_segundos' => 30],
    ], 3],
    // 3 séries × 10 repetições × 3 s + 3 × 45 s = 225 s → 4 min (arredonda para cima)
    'so por repeticoes' => [[
        ['series' => 3, 'repeticoes' => 10, 'duracao_segundos' => null, 'descanso_segundos' => 45],
    ], 4],
    // 180 s + 225 s = 405 s → 7 min
    'mistos' => [[
        ['series' => 2, 'repeticoes' => null, 'duracao_segundos' => 60, 'descanso_segundos' => 30],
        ['series' => 3, 'repeticoes' => 10, 'duracao_segundos' => null, 'descanso_segundos' => 45],
    ], 7],
    // Com os dois preenchidos vale a duração: 1 × 30 s + 0 de descanso = 30 s → 1 min
    'repeticoes e duracao juntas' => [[
        ['series' => 1, 'repeticoes' => 100, 'duracao_segundos' => 30, 'descanso_segundos' => 0],
    ], 1],
    // Sem descanso e 1 repetição: 3 s → ainda assim 1 minuto
    'minimo e 1 minuto' => [[
        ['series' => 1, 'repeticoes' => 1, 'duracao_segundos' => null, 'descanso_segundos' => 0],
    ], 1],
    // Exatamente 2 minutos: 1 × 120 s
    'multiplo exato nao arredonda' => [[
        ['series' => 1, 'repeticoes' => null, 'duracao_segundos' => 120, 'descanso_segundos' => 0],
    ], 2],
    // Teto do contrato: 30 itens × 10 séries × (3600 + 600) s = 21 000 min, cabe em smallint
    'teto do contrato' => [
        array_fill(0, 30, ['series' => 10, 'repeticoes' => null, 'duracao_segundos' => 3600, 'descanso_segundos' => 600]),
        21000,
    ],
]);
