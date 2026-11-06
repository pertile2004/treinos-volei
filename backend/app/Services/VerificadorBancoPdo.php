<?php

namespace App\Services;

use App\Contracts\VerificadorBanco;
use Illuminate\Database\DatabaseManager;
use Psr\Log\LoggerInterface;
use Throwable;

class VerificadorBancoPdo implements VerificadorBanco
{
    public function __construct(
        private readonly DatabaseManager $banco,
        private readonly LoggerInterface $log,
    ) {}

    public function disponivel(): bool
    {
        try {
            $conexao = $this->banco->connection();
            $conexao->getPdo();
            $conexao->select('select 1');

            return true;
        } catch (Throwable $e) {
            $this->log->error('Banco de dados indisponível.', ['exception' => $e]);

            return false;
        }
    }
}
