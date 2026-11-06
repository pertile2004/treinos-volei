<?php

namespace App\Http\Resources;

use App\Models\Agendamento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Agendamento
 */
class AgendamentoResource extends JsonResource
{
    /**
     * O recurso tem um campo chamado "data" (o dia), e o empacotamento padrão
     * do Laravel entenderia que a resposta já está embrulhada e devolveria o
     * agendamento solto. Aqui o { "data": {...} } é montado à mão, com 201 na criação.
     *
     * @param  Request  $request
     */
    public function toResponse($request): JsonResponse
    {
        return new JsonResponse(
            ['data' => $this->resolve($request)],
            $this->resource->wasRecentlyCreated ? 201 : 200,
        );
    }

    /**
     * O treino vem sempre por eager loading (inclusive excluído logicamente),
     * para os agendamentos passados continuarem legíveis.
     *
     * @return array{id: int, data: string, hora: string|null, concluido: bool, sessao_id: int|null, treino: array{id: int, nome: string, duracao_estimada_minutos: int}}
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'data' => $this->data->toDateString(),
            'hora' => $this->hora === null ? null : substr($this->hora, 0, 5),
            'concluido' => $this->sessao_id !== null,
            'sessao_id' => $this->sessao_id,
            'treino' => [
                'id' => $this->treino->id,
                'nome' => $this->treino->nome,
                'duracao_estimada_minutos' => $this->treino->duracao_estimada_minutos,
            ],
        ];
    }
}
