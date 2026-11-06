<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CadastroRequest;
use App\Http\Resources\UsuarioResource;
use App\Services\CadastroService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class CadastroController extends Controller
{
    /**
     * Cria a conta, inicia a sessão e devolve o usuário recém-criado.
     */
    public function __invoke(CadastroRequest $request, CadastroService $cadastro): JsonResponse
    {
        /** @var array{nome: string, email: string, password: string, papel: string, aceite_termos: mixed} $dados */
        $dados = $request->validated();

        $usuario = $cadastro->cadastrar($dados);

        // Novo id de sessão após autenticar, contra fixação de sessão.
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return (new UsuarioResource($usuario))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}
