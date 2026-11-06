<?php

namespace App\Policies;

use App\Models\Agendamento;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * RN-11: cada um só mexe nos próprios agendamentos. Agendamento de outro
 * usuário responde 404 (padrão do docs/API.md: "não existe ou não é seu").
 */
class AgendamentoPolicy
{
    public function viewAny(User $usuario): bool
    {
        return true;
    }

    public function create(User $usuario): bool
    {
        return true;
    }

    public function update(User $usuario, Agendamento $agendamento): Response
    {
        return $this->doDono($usuario, $agendamento);
    }

    public function delete(User $usuario, Agendamento $agendamento): Response
    {
        return $this->doDono($usuario, $agendamento);
    }

    private function doDono(User $usuario, Agendamento $agendamento): Response
    {
        return $agendamento->usuario_id === $usuario->id
            ? Response::allow()
            : Response::denyAsNotFound();
    }
}
