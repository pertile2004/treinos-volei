<?php

namespace App\Policies;

use App\Models\User;

/**
 * Autorização de treinos (RN-11). Ver, alterar e excluir entram nos PR-13 a 15.
 */
class TreinoPolicy
{
    /**
     * Qualquer usuário logado cria treinos; o que muda por papel é a
     * visibilidade aceita (RN-06), validada no CriarTreinoRequest.
     */
    public function create(User $usuario): bool
    {
        return true;
    }
}
