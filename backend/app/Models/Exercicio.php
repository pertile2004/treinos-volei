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
     * Caminho da ilustração própria e neutra de cada fundamento (arquivo estático do SPA).
     */
    public static function ilustracaoDoFundamento(Fundamento $fundamento): string
    {
        return '/ilustracoes/'.$fundamento->value.'.svg';
    }

    /**
     * Imagem mostrada na biblioteca: a própria, ou a ilustração do fundamento quando não há.
     */
    public function imagemUrlOuPadrao(): string
    {
        return $this->imagem_url ?? self::ilustracaoDoFundamento($this->fundamento);
    }
}
