<?php

namespace App\Http\Requests;

use App\Enums\Papel;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Dados do cadastro de conta (RF-01). Rota pública: qualquer visitante pode enviar.
 */
class CadastroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * O e-mail é comparado e guardado em minúsculas: o PostgreSQL diferencia
     * maiúsculas no índice único e a mesma pessoa não pode ter duas contas.
     */
    protected function prepareForValidation(): void
    {
        $email = $this->input('email');

        if (is_string($email)) {
            $this->merge(['email' => Str::lower(trim($email))]);
        }
    }

    /**
     * @return array<string, list<ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'papel' => ['required', Rule::enum(Papel::class)->only([Papel::Jogador, Papel::Treinador])],
            'aceite_termos' => ['required', 'accepted'],
        ];
    }

    /**
     * Mesmos textos que o formulário mostra antes de chamar a API.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nome.required' => 'Informe seu nome (mínimo de 2 caracteres).',
            'nome.min' => 'Informe seu nome (mínimo de 2 caracteres).',
            'nome.max' => 'O nome pode ter no máximo 100 caracteres.',
            'email.required' => 'Informe um e-mail válido.',
            'email.email' => 'Informe um e-mail válido.',
            'email.max' => 'O e-mail pode ter no máximo 255 caracteres.',
            'email.unique' => 'O e-mail já está em uso.',
            'password.required' => 'A senha precisa ter no mínimo 8 caracteres.',
            'password.min' => 'A senha precisa ter no mínimo 8 caracteres.',
            'password.confirmed' => 'As senhas não conferem.',
            'papel.required' => 'Escolha entre jogador e treinador.',
            'papel.enum' => 'Escolha entre jogador e treinador.',
            'aceite_termos.required' => 'Você precisa aceitar os termos.',
            'aceite_termos.accepted' => 'Você precisa aceitar os termos.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'nome' => 'nome',
            'email' => 'e-mail',
            'password' => 'senha',
            'password_confirmation' => 'confirmação de senha',
            'papel' => 'papel',
            'aceite_termos' => 'aceite dos termos',
        ];
    }
}
