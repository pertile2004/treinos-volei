<?php

namespace App\Services;

use App\Enums\Papel;
use App\Models\User;
use Illuminate\Contracts\Auth\StatefulGuard;

/**
 * Cria a conta e inicia a sessão (RF-01).
 *
 * Grava só os campos validados: meta_semanal fica no padrão 3 e
 * codigo_convite e treinador_id nascem nulos (RN-05, PR-22).
 */
class CadastroService
{
    public function __construct(private readonly StatefulGuard $guard) {}

    /**
     * @param  array{nome: string, email: string, password: string, papel: string}  $dados
     */
    public function cadastrar(array $dados): User
    {
        $usuario = User::create([
            'nome' => $dados['nome'],
            'email' => $dados['email'],
            'password' => $dados['password'],
            'papel' => Papel::from($dados['papel']),
        ]);

        $this->guard->login($usuario);

        return $usuario;
    }
}
