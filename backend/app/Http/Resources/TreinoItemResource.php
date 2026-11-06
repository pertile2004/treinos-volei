<?php

namespace App\Http\Resources;

use App\Models\TreinoItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Item de treino com o exercício, mesmo já excluído da biblioteca (RN-07):
 * `removido` sustenta o selo "removido da biblioteca".
 *
 * @mixin TreinoItem
 */
class TreinoItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'etapa' => $this->etapa,
            'ordem' => $this->ordem,
            'series' => $this->series,
            'repeticoes' => $this->repeticoes,
            'duracao_segundos' => $this->duracao_segundos,
            'descanso_segundos' => $this->descanso_segundos,
            'exercicio' => [
                'id' => $this->exercicio->id,
                'nome' => $this->exercicio->nome,
                'fundamento' => $this->exercicio->fundamento,
                'removido' => $this->exercicio->trashed(),
            ],
        ];
    }
}
