<?php

namespace App\Enums;

use App\Enums\Concerns\ComOpcoes;

/**
 * Fundamento do vôlei usado para classificar exercícios.
 */
enum Fundamento: string
{
    use ComOpcoes;

    case Recepcao = 'recepcao';
    case Levantamento = 'levantamento';
    case Ataque = 'ataque';
    case Saque = 'saque';
    case Bloqueio = 'bloqueio';
    case Defesa = 'defesa';
    case PreparoFisico = 'preparo_fisico';

    public function rotulo(): string
    {
        return match ($this) {
            self::Recepcao => 'Recepção',
            self::Levantamento => 'Levantamento',
            self::Ataque => 'Ataque',
            self::Saque => 'Saque',
            self::Bloqueio => 'Bloqueio',
            self::Defesa => 'Defesa',
            self::PreparoFisico => 'Preparo físico',
        };
    }
}
