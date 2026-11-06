<?php

return [

    /*
    |--------------------------------------------------------------------------
    | CORS
    |--------------------------------------------------------------------------
    |
    | Só a origem do front (FRONTEND_URL; mais de uma, separadas por vírgula)
    | pode ler as respostas da API em outra origem, e com credenciais, porque
    | a autenticação é por cookie de sessão (Sanctum SPA). Nunca use "*" aqui.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        trim(...),
        explode(',', (string) env('FRONTEND_URL', 'http://localhost:5173')),
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['X-Request-Id'],

    'max_age' => 0,

    'supports_credentials' => true,

];
