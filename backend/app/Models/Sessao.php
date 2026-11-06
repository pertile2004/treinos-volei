<?php

namespace App\Models;

use App\Enums\OrigemSessao;
use Database\Factories\SessaoFactory;
use Illuminate\Database\Eloquent\Attributes\DateFormat;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Execução registrada de um treino ou registro rápido.
 *
 * O formato de data leva o deslocamento do fuso (P) porque iniciada_em e
 * finalizada_em são timestamptz: assim o banco grava o instante certo mesmo
 * que a data chegue em outro fuso (RN-01).
 *
 * usuario_id fica fora do #[Fillable]: crie com $usuario->sessoes()->create([...]).
 */
#[Table('sessoes')]
#[DateFormat('Y-m-d H:i:sP')]
#[Fillable(['treino_id', 'origem', 'iniciada_em', 'finalizada_em', 'duracao_segundos', 'observacao', 'id_cliente'])]
class Sessao extends Model
{
    /** @use HasFactory<SessaoFactory> */
    use HasFactory;

    /**
     * Casts dos atributos. O formato array{...} é o que o Larastan lê para tipar o model.
     *
     * @return array{origem: 'App\Enums\OrigemSessao', iniciada_em: 'datetime', finalizada_em: 'datetime', duracao_segundos: 'integer'}
     */
    protected function casts(): array
    {
        return [
            'origem' => OrigemSessao::class,
            'iniciada_em' => 'datetime',
            'finalizada_em' => 'datetime',
            'duracao_segundos' => 'integer',
        ];
    }

    /**
     * Usuário que treinou.
     *
     * @return BelongsTo<User, $this>
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    /**
     * Treino executado, inclusive o já excluído (RN-08); null no registro rápido.
     *
     * @return BelongsTo<Treino, $this>
     */
    public function treino(): BelongsTo
    {
        return $this->belongsTo(Treino::class)->withTrashed();
    }

    /**
     * Séries registradas na sessão.
     *
     * @return HasMany<SessaoSerie, $this>
     */
    public function series(): HasMany
    {
        return $this->hasMany(SessaoSerie::class);
    }
}
