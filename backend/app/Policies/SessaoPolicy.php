<?php

namespace App\Policies;

use App\Models\Sessao;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Só o dono enxerga a sessão (RN-11). Para quem não é dono a resposta é 404,
 * não 403: a API não revela que a sessão existe (docs/API.md).
 */
class SessaoPolicy
{
    public function view(User $usuario, Sessao $sessao): Response
    {
        return $sessao->usuario_id === $usuario->id
            ? Response::allow()
            : Response::denyAsNotFound();
    }
}
