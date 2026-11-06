<?php

namespace App\Policies;

use App\Models\Exercicio;
use App\Models\User;

/**
 * A biblioteca é comum a todos os papéis (RN-11): qualquer usuário logado lê.
 * A gestão (criar, alterar, excluir) é do admin e entra nos PR-09 a PR-11.
 */
class ExercicioPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Exercicio $exercicio): bool
    {
        return true;
    }
}
