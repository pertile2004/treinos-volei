<?php

namespace App\Contracts;

/**
 * Fronteira com o banco de dados para a checagem de saúde.
 */
interface VerificadorBanco
{
    public function disponivel(): bool;
}
