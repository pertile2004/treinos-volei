<?php

namespace App\Enums;

use App\Enums\Concerns\ComOpcoes;

/**
 * Nível de dificuldade de exercícios e treinos.
 */
enum Nivel: string
{
    use ComOpcoes;

    case Iniciante = 'iniciante';
    case Intermediario = 'intermediario';
    case Avancado = 'avancado';

    public function rotulo(): string
    {
        return match ($this) {
            self::Iniciante => 'Iniciante',
            self::Intermediario => 'Intermediário',
            self::Avancado => 'Avançado',
        };
    }
}
