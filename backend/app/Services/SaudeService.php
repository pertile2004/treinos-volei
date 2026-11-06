<?php

namespace App\Services;

use App\Contracts\VerificadorBanco;
use Illuminate\Contracts\Config\Repository;

class SaudeService
{
    public function __construct(
        private readonly VerificadorBanco $verificadorBanco,
        private readonly Repository $config,
    ) {}

    /**
     * @return array{status: string, banco: string, versao: string, horario: string}
     */
    public function verificar(): array
    {
        $bancoDisponivel = $this->verificadorBanco->disponivel();

        return [
            'status' => $bancoDisponivel ? 'ok' : 'indisponivel',
            'banco' => $bancoDisponivel ? 'ok' : 'fora',
            'versao' => (string) $this->config->get('app.versao'),
            'horario' => now()->utc()->toIso8601String(),
        ];
    }
}
