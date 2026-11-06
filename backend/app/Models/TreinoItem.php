<?php

namespace App\Models;

use App\Enums\Etapa;
use Database\Factories\TreinoItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Exercício dentro de um treino, com etapa, ordem e parâmetros próprios.
 * A tabela não tem timestamps.
 *
 * treino_id fica fora do #[Fillable]: crie com $treino->itens()->create([...]).
 */
#[Table('treino_itens', timestamps: false)]
#[Fillable(['exercicio_id', 'etapa', 'ordem', 'series', 'repeticoes', 'duracao_segundos', 'descanso_segundos'])]
class TreinoItem extends Model
{
    /** @use HasFactory<TreinoItemFactory> */
    use HasFactory;

    /**
     * Casts dos atributos. O formato array{...} é o que o Larastan lê para tipar o model.
     *
     * @return array{etapa: 'App\Enums\Etapa', ordem: 'integer', series: 'integer', repeticoes: 'integer', duracao_segundos: 'integer', descanso_segundos: 'integer'}
     */
    protected function casts(): array
    {
        return [
            'etapa' => Etapa::class,
            'ordem' => 'integer',
            'series' => 'integer',
            'repeticoes' => 'integer',
            'duracao_segundos' => 'integer',
            'descanso_segundos' => 'integer',
        ];
    }

    /**
     * Treino ao qual o item pertence.
     *
     * @return BelongsTo<Treino, $this>
     */
    public function treino(): BelongsTo
    {
        return $this->belongsTo(Treino::class);
    }

    /**
     * Exercício do item, inclusive o já excluído da biblioteca (RN-07).
     *
     * @return BelongsTo<Exercicio, $this>
     */
    public function exercicio(): BelongsTo
    {
        return $this->belongsTo(Exercicio::class)->withTrashed();
    }
}
