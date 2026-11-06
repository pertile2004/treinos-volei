<?php

namespace App\Models;

use Database\Factories\AgendamentoFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Treino agendado para um dia (e hora, opcional). data e hora são o dia e a
 * hora locais do usuário, não um instante em UTC. Concluído = tem sessao_id.
 *
 * usuario_id e sessao_id ficam fora do #[Fillable]: crie com
 * $usuario->agendamentos()->create([...]) e vincule com
 * $agendamento->sessao()->associate($sessao).
 */
#[Table('agendamentos')]
#[Fillable(['treino_id', 'data', 'hora'])]
class Agendamento extends Model
{
    /** @use HasFactory<AgendamentoFactory> */
    use HasFactory;

    /**
     * Casts dos atributos. O formato array{...} é o que o Larastan lê para tipar o model.
     *
     * @return array{data: 'date'}
     */
    protected function casts(): array
    {
        return [
            'data' => 'date',
        ];
    }

    /**
     * Dono do agendamento.
     *
     * @return BelongsTo<User, $this>
     */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    /**
     * Treino agendado, inclusive o já excluído (os agendamentos passados continuam legíveis).
     *
     * @return BelongsTo<Treino, $this>
     */
    public function treino(): BelongsTo
    {
        return $this->belongsTo(Treino::class)->withTrashed();
    }

    /**
     * Sessão que concluiu o agendamento; null enquanto estiver pendente.
     *
     * @return BelongsTo<Sessao, $this>
     */
    public function sessao(): BelongsTo
    {
        return $this->belongsTo(Sessao::class);
    }
}
