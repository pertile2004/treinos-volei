<?php

namespace App\Enums;

use App\Enums\Concerns\ComOpcoes;

/**
 * Visibilidade de um treino (RN-06).
 */
enum Visibilidade: string
{
    use ComOpcoes;

    case Privado = 'privado';
    case Atletas = 'atletas';
    case Publico = 'publico';

    public function rotulo(): string
    {
        return match ($this) {
            self::Privado => 'Privado',
            self::Atletas => 'Atletas',
            self::Publico => 'Público',
        };
    }
}
