<?php

namespace App\Enums;

use App\Enums\Concerns\ComOpcoes;

/**
 * Como uma sessão de treino foi registrada.
 */
enum OrigemSessao: string
{
    use ComOpcoes;

    case Cronometro = 'cronometro';
    case RegistroRapido = 'registro_rapido';

    public function rotulo(): string
    {
        return match ($this) {
            self::Cronometro => 'Cronômetro',
            self::RegistroRapido => 'Registro rápido',
        };
    }
}
