<?php

it('lista as referencias do dominio com rotulos acentuados', function () {
    $resposta = $this->getJson('/api/v1/referencias');

    $resposta->assertOk()
        ->assertJsonCount(7, 'data.fundamentos')
        ->assertJsonPath('data.fundamentos.0', ['valor' => 'recepcao', 'rotulo' => 'Recepção'])
        ->assertJsonPath('data.fundamentos.6', ['valor' => 'preparo_fisico', 'rotulo' => 'Preparo físico']);

    $dados = $resposta->json('data');

    expect(array_keys($dados))->toBe([
        'papeis', 'fundamentos', 'niveis', 'etapas', 'visibilidades', 'origens_sessao',
    ]);

    foreach ($dados as $itens) {
        expect($itens)->not->toBeEmpty();

        foreach ($itens as $item) {
            expect(array_keys($item))->toBe(['valor', 'rotulo'])
                ->and($item['valor'])->toBeString()->not->toBeEmpty()
                ->and($item['rotulo'])->toBeString()->not->toBeEmpty();
        }
    }
});
