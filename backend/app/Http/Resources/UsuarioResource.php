<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Dados do próprio usuário (RN-11). Nunca inclui password nem remember_token.
 *
 * @property User $resource
 */
class UsuarioResource extends JsonResource
{
    /**
     * @return array{id: int, nome: string, email: string, papel: string, meta_semanal: int, data_nascimento: string|null}
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'nome' => $this->resource->nome,
            'email' => $this->resource->email,
            'papel' => $this->resource->papel->value,
            'meta_semanal' => $this->resource->meta_semanal,
            'data_nascimento' => $this->resource->data_nascimento?->toDateString(),
        ];
    }
}
