<?php

namespace App\Http\Resources;

use App\Models\Exercicio;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Detalhe GET /exercicios/{id}. criado_por, deleted_at e timestamps não são expostos.
 *
 * @property Exercicio $resource
 */
class ExercicioResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'nome' => $this->resource->nome,
            'descricao' => $this->resource->descricao,
            'foco' => $this->resource->foco,
            'fundamento' => $this->resource->fundamento->value,
            'fundamento_rotulo' => $this->resource->fundamento->rotulo(),
            'nivel' => $this->resource->nivel->value,
            'nivel_rotulo' => $this->resource->nivel->rotulo(),
            'series_padrao' => $this->resource->series_padrao,
            'repeticoes_padrao' => $this->resource->repeticoes_padrao,
            'duracao_segundos_padrao' => $this->resource->duracao_segundos_padrao,
            'descanso_segundos' => $this->resource->descanso_segundos,
            'video_url' => $this->resource->video_url,
            'imagem_url' => $this->resource->imagemUrlOuPadrao(),
        ];
    }
}
