<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Fuso de negócio
    |--------------------------------------------------------------------------
    |
    | As datas ficam gravadas em UTC (RN-01); este é o fuso em que o usuário
    | enxerga dias, semanas e meses (janelas das estatísticas, dia de treino).
    |
    */

    'fuso' => 'America/Sao_Paulo',

    /*
    |--------------------------------------------------------------------------
    | Dados de demonstração (DemoSeeder)
    |--------------------------------------------------------------------------
    |
    | O DemoSeeder cria contas com senha conhecida, por isso só roda nos
    | ambientes listados. A senha nunca fica no repositório: vem do .env.
    |
    */

    'demo' => [
        'ambientes' => ['local', 'demo', 'testing'],
        'senha' => env('DEMO_SENHA'),
    ],

];
