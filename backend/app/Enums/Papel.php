<?php

namespace App\Enums;

use App\Enums\Concerns\ComOpcoes;

/**
 * Papel do usuário na plataforma.
 */
enum Papel: string
{
    use ComOpcoes;

    case Jogador = 'jogador';
    case Treinador = 'treinador';
    case Admin = 'admin';

    public function rotulo(): string
    {
        return match ($this) {
            self::Jogador => 'Jogador',
            self::Treinador => 'Treinador',
            self::Admin => 'Administrador',
        };
    }
}
