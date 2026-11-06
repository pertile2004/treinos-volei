<?php

use App\Enums\Etapa;
use App\Enums\Fundamento;
use App\Enums\Nivel;
use App\Enums\OrigemSessao;
use App\Enums\Papel;
use App\Enums\Visibilidade;

it('tem os valores e os rotulos do dominio, na ordem', function (string $enum, array $esperado) {
    $obtido = [];

    foreach ($enum::cases() as $caso) {
        expect($caso->rotulo())->toBeString()->not->toBeEmpty();

        $obtido[$caso->value] = $caso->rotulo();
    }

    expect($obtido)->toBe($esperado);
})->with([
    'Papel' => [Papel::class, [
        'jogador' => 'Jogador',
        'treinador' => 'Treinador',
        'admin' => 'Administrador',
    ]],
    'Fundamento' => [Fundamento::class, [
        'recepcao' => 'Recepção',
        'levantamento' => 'Levantamento',
        'ataque' => 'Ataque',
        'saque' => 'Saque',
        'bloqueio' => 'Bloqueio',
        'defesa' => 'Defesa',
        'preparo_fisico' => 'Preparo físico',
    ]],
    'Nivel' => [Nivel::class, [
        'iniciante' => 'Iniciante',
        'intermediario' => 'Intermediário',
        'avancado' => 'Avançado',
    ]],
    'Etapa' => [Etapa::class, [
        'aquecimento' => 'Aquecimento',
        'tecnica' => 'Técnica',
        'especifico' => 'Específico',
        'volta_a_calma' => 'Volta à calma',
    ]],
    'Visibilidade' => [Visibilidade::class, [
        'privado' => 'Privado',
        'atletas' => 'Atletas',
        'publico' => 'Público',
    ]],
    'OrigemSessao' => [OrigemSessao::class, [
        'cronometro' => 'Cronômetro',
        'registro_rapido' => 'Registro rápido',
    ]],
]);
