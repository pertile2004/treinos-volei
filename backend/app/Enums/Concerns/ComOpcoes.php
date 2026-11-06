<?php

namespace App\Enums\Concerns;

/**
 * Lista os cases de um enum com rótulo no formato usado pela API.
 */
trait ComOpcoes
{
    /**
     * @return list<array{valor: string, rotulo: string}>
     */
    public static function opcoes(): array
    {
        return array_map(
            fn (self $caso): array => ['valor' => $caso->value, 'rotulo' => $caso->rotulo()],
            self::cases(),
        );
    }
}
