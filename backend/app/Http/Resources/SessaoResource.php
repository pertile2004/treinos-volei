<?php

namespace App\Http\Resources;

use App\Models\Sessao;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Sessão com treino e séries. Espera as relações `treino` e `series.exercicio`
 * carregadas (SessaoService::carregar): no modo estrito, lazy loading é erro.
 *
 * @mixin Sessao
 */
class SessaoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'id_cliente' => $this->id_cliente,
            'origem' => $this->origem->value,
            'treino' => $this->treino === null ? null : [
                'id' => $this->treino->id,
                'nome' => $this->treino->nome,
            ],
            'iniciada_em' => $this->iniciada_em->toIso8601ZuluString(),
            'finalizada_em' => $this->finalizada_em->toIso8601ZuluString(),
            'duracao_segundos' => $this->duracao_segundos,
            'observacao' => $this->observacao,
            'series' => SessaoSerieResource::collection($this->series),
        ];
    }
}
