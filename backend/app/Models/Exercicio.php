<?php

namespace App\Models;

use App\Enums\Fundamento;
use App\Enums\Nivel;
use Database\Factories\ExercicioFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Exercício da biblioteca. A exclusão é lógica (RN-07): sai da biblioteca,
 * mas continua nos treinos e no histórico.
 *
 * criado_por fica fora do #[Fillable]: use $exercicio->criador()->associate($usuario).
 */
#[Table('exercicios')]
#[Fillable([
    'nome',
    'descricao',
    'foco',
    'fundamento',
    'nivel',
    'series_padrao',
    'repeticoes_padrao',
    'duracao_segundos_padrao',
    'descanso_segundos',
    'video_url',
    'imagem_url',
])]
class Exercicio extends Model
{
    /** @use HasFactory<ExercicioFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Mesmo padrão da coluna no banco, para o model recém-criado já sair completo.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'descanso_segundos' => 45,
    ];

    /**
     * Casts dos atributos. O formato array{...} é o que o Larastan lê para tipar o model.
     *
     * @return array{fundamento: 'App\Enums\Fundamento', nivel: 'App\Enums\Nivel', series_padrao: 'integer', repeticoes_padrao: 'integer', duracao_segundos_padrao: 'integer', descanso_segundos: 'integer'}
     */
    protected function casts(): array
    {
        return [
            'fundamento' => Fundamento::class,
            'nivel' => Nivel::class,
            'series_padrao' => 'integer',
            'repeticoes_padrao' => 'integer',
            'duracao_segundos_padrao' => 'integer',
            'descanso_segundos' => 'integer',
        ];
    }

    /**
     * Usuário (admin) que cadastrou o exercício.
     *
     * @return BelongsTo<User, $this>
     */
    public function criador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'criado_por');
    }

    /**
     * Itens de treino que usam este exercício.
     *
     * @return HasMany<TreinoItem, $this>
     */
    public function treinoItens(): HasMany
    {
        return $this->hasMany(TreinoItem::class);
    }
}
