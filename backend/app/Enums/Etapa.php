<?php

namespace App\Enums;

use App\Enums\Concerns\ComOpcoes;

/**
 * Etapa de um treino.
 */
enum Etapa: string
{
    use ComOpcoes;

    case Aquecimento = 'aquecimento';
    case Tecnica = 'tecnica';
    case Especifico = 'especifico';
    case VoltaACalma = 'volta_a_calma';

    public function rotulo(): string
    {
        return match ($this) {
            self::Aquecimento => 'Aquecimento',
            self::Tecnica => 'Técnica',
            self::Especifico => 'Específico',
            self::VoltaACalma => 'Volta à calma',
        };
    }
}
