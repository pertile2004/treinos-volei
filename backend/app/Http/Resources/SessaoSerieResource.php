<?php

namespace App\Http\Resources;

use App\Models\SessaoSerie;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Série de uma sessão. `exercicio.removido` é o selo "removido da biblioteca" (RN-07);
 * `exercicio` é null só quando o exercício foi apagado de vez.
 *
 * @mixin SessaoSerie
 */
class SessaoSerieResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exercicio' => $this->exercicio === null ? null : [
                'id' => $this->exercicio->id,
                'nome' => $this->exercicio->nome,
                'removido' => $this->exercicio->trashed(),
            ],
            'fundamento' => $this->fundamento->value,
            'numero' => $this->numero,
            'repeticoes' => $this->repeticoes,
            'acertos' => $this->acertos,
            'erros' => $this->erros,
            'duracao_segundos' => $this->duracao_segundos,
        ];
    }
}
