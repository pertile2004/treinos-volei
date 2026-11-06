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
    | ambientes listados. As senhas nunca ficam no repositório: vêm do .env.
    | O admin tem senha própria (DEMO_SENHA_ADMIN): quem recebe a senha do
    | jogador para testar não entra como administrador.
    |
    */

    'demo' => [
        'ambientes' => ['local', 'demo', 'testing'],
        'senha' => env('DEMO_SENHA'),
        'senha_admin' => env('DEMO_SENHA_ADMIN'),
    ],

];
