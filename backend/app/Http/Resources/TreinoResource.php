<?php

namespace App\Http\Resources;

use App\Models\Treino;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Treino completo, com autor e itens. Exige autor e itens.exercicio carregados.
 *
 * @mixin Treino
 */
class TreinoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'descricao' => $this->descricao,
            'nivel' => $this->nivel,
            'visibilidade' => $this->visibilidade,
            'duracao_estimada_minutos' => $this->duracao_estimada_minutos,
            'autor' => [
                'id' => $this->autor->id,
                'nome' => $this->autor->nome,
            ],
            'itens' => TreinoItemResource::collection($this->itens),
            'criado_em' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
