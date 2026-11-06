<?php

namespace App\Services;

use App\Enums\Etapa;
use App\Enums\Fundamento;
use App\Enums\Nivel;
use App\Enums\OrigemSessao;
use App\Enums\Papel;
use App\Enums\Visibilidade;

class ReferenciasService
{
    /**
     * @return array<string, list<array{valor: string, rotulo: string}>>
     */
    public function listar(): array
    {
        return [
            'papeis' => Papel::opcoes(),
            'fundamentos' => Fundamento::opcoes(),
            'niveis' => Nivel::opcoes(),
            'etapas' => Etapa::opcoes(),
            'visibilidades' => Visibilidade::opcoes(),
            'origens_sessao' => OrigemSessao::opcoes(),
        ];
    }
}
