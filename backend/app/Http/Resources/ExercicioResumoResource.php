<?php

namespace App\Http\Resources;

use App\Models\Exercicio;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Item da lista GET /exercicios: sem descrição nem video_url (só o aviso tem_video).
 *
 * @property Exercicio $resource
 */
class ExercicioResumoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'nome' => $this->resource->nome,
            'foco' => $this->resource->foco,
            'fundamento' => $this->resource->fundamento->value,
            'fundamento_rotulo' => $this->resource->fundamento->rotulo(),
            'nivel' => $this->resource->nivel->value,
            'nivel_rotulo' => $this->resource->nivel->rotulo(),
            'series_padrao' => $this->resource->series_padrao,
            'repeticoes_padrao' => $this->resource->repeticoes_padrao,
            'duracao_segundos_padrao' => $this->resource->duracao_segundos_padrao,
            'descanso_segundos' => $this->resource->descanso_segundos,
            'tem_video' => $this->resource->video_url !== null,
            'imagem_url' => $this->resource->imagemUrlOuPadrao(),
        ];
    }
}
