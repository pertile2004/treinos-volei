<?php

namespace App\Models;

use App\Enums\Fundamento;
use Database\Factories\SessaoSerieFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Série de uma sessão. O fundamento é copiado do exercício no momento do
 * registro, então as estatísticas não dependem de o exercício ainda existir.
 * A tabela não tem timestamps.
 *
 * sessao_id fica fora do #[Fillable]: crie com $sessao->series()->createMany([...]).
 */
#[Table('sessao_series', timestamps: false)]
#[Fillable(['exercicio_id', 'fundamento', 'numero', 'repeticoes', 'acertos', 'erros', 'duracao_segundos'])]
class SessaoSerie extends Model
{
    /** @use HasFactory<SessaoSerieFactory> */
    use HasFactory;

    /**
     * Mesmos padrões das colunas no banco, para o model recém-criado já sair completo.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'acertos' => 0,
        'erros' => 0,
    ];

    /**
     * Casts dos atributos. O formato array{...} é o que o Larastan lê para tipar o model.
     *
     * @return array{fundamento: 'App\Enums\Fundamento', numero: 'integer', repeticoes: 'integer', acertos: 'integer', erros: 'integer', duracao_segundos: 'integer'}
     */
    protected function casts(): array
    {
        return [
            'fundamento' => Fundamento::class,
            'numero' => 'integer',
            'repeticoes' => 'integer',
            'acertos' => 'integer',
            'erros' => 'integer',
            'duracao_segundos' => 'integer',
        ];
    }

    /**
     * Sessão à qual a série pertence.
     *
     * @return BelongsTo<Sessao, $this>
     */
    public function sessao(): BelongsTo
    {
        return $this->belongsTo(Sessao::class);
    }

    /**
     * Exercício da série, inclusive o já excluído da biblioteca (RN-07);
     * null no registro rápido.
     *
     * @return BelongsTo<Exercicio, $this>
     */
    public function exercicio(): BelongsTo
    {
        return $this->belongsTo(Exercicio::class)->withTrashed();
    }
}
