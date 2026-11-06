<?php

namespace App\Models;

use App\Enums\Nivel;
use App\Enums\Visibilidade;
use Database\Factories\TreinoFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Treino: sequência de exercícios em etapas. A exclusão é lógica (RN-08).
 *
 * autor_id fica fora do #[Fillable]: crie com $usuario->treinos()->create([...]).
 */
#[Table('treinos')]
#[Fillable(['nome', 'descricao', 'nivel', 'visibilidade', 'duracao_estimada_minutos'])]
class Treino extends Model
{
    /** @use HasFactory<TreinoFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Casts dos atributos. O formato array{...} é o que o Larastan lê para tipar o model.
     *
     * @return array{nivel: 'App\Enums\Nivel', visibilidade: 'App\Enums\Visibilidade', duracao_estimada_minutos: 'integer'}
     */
    protected function casts(): array
    {
        return [
            'nivel' => Nivel::class,
            'visibilidade' => Visibilidade::class,
            'duracao_estimada_minutos' => 'integer',
        ];
    }

    /**
     * Usuário que criou o treino.
     *
     * @return BelongsTo<User, $this>
     */
    public function autor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'autor_id');
    }

    /**
     * Exercícios do treino, por etapa e ordem.
     *
     * @return HasMany<TreinoItem, $this>
     */
    public function itens(): HasMany
    {
        return $this->hasMany(TreinoItem::class);
    }

    /**
     * Sessões em que este treino foi executado.
     *
     * @return HasMany<Sessao, $this>
     */
    public function sessoes(): HasMany
    {
        return $this->hasMany(Sessao::class);
    }

    /**
     * Agendamentos deste treino.
     *
     * @return HasMany<Agendamento, $this>
     */
    public function agendamentos(): HasMany
    {
        return $this->hasMany(Agendamento::class);
    }
}
