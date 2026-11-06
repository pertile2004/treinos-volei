<?php

// Com uma única origem permitida, o framework devolve sempre essa origem no
// cabeçalho; o navegador barra a leitura quando ela difere da origem do site.
it('libera o CORS com credenciais so para a origem do front', function () {
    $origem = config('cors.allowed_origins')[0];

    expect(config('cors.allowed_origins'))->not->toContain('*')
        ->and(config('cors.supports_credentials'))->toBeTrue();

    $this->getJson('/api/v1/referencias', ['Origin' => $origem])
        ->assertOk()
        ->assertHeader('Access-Control-Allow-Origin', $origem)
        ->assertHeader('Access-Control-Allow-Credentials', 'true');
});

it('nao libera o CORS para uma origem desconhecida', function () {
    $resposta = $this->getJson('/api/v1/referencias', ['Origin' => 'https://site-desconhecido.example']);

    $resposta->assertOk();

    expect($resposta->headers->get('Access-Control-Allow-Origin'))
        ->not->toBe('*')
        ->not->toBe('https://site-desconhecido.example');
});

it('nao libera o preflight de uma origem desconhecida', function () {
    $resposta = $this->call('OPTIONS', '/api/v1/referencias', server: [
        'HTTP_ORIGIN' => 'https://site-desconhecido.example',
        'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
    ]);

    expect($resposta->headers->get('Access-Control-Allow-Origin'))
        ->not->toBe('*')
        ->not->toBe('https://site-desconhecido.example');
});
