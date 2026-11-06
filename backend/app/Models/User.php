<?php

namespace App\Models;

use App\Enums\Papel;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * Conta de jogador, treinador ou admin.
 *
 * codigo_convite e treinador_id ficam fora do #[Fillable]: só os services gravam.
 */
#[Table('users')]
#[Fillable(['nome', 'email', 'password', 'papel', 'meta_semanal', 'data_nascimento'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Mesmo padrão da coluna no banco, para o model recém-criado já sair completo.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'meta_semanal' => 3,
    ];

    /**
     * Casts dos atributos. O formato array{...} é o que o Larastan lê para tipar o model.
     *
     * @return array{email_verified_at: 'datetime', password: 'hashed', papel: 'App\Enums\Papel', meta_semanal: 'integer', data_nascimento: 'date'}
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'papel' => Papel::class,
            'meta_semanal' => 'integer',
            'data_nascimento' => 'date',
        ];
    }

    /**
     * Treinador ao qual o atleta está vinculado (RN-05: no máximo um).
     *
     * @return BelongsTo<User, $this>
     */
    public function treinador(): BelongsTo
    {
        return $this->belongsTo(self::class, 'treinador_id');
    }

    /**
     * Atletas vinculados a este treinador.
     *
     * @return HasMany<User, $this>
     */
    public function atletas(): HasMany
    {
        return $this->hasMany(self::class, 'treinador_id');
    }

    /**
     * Treinos criados pelo usuário.
     *
     * @return HasMany<Treino, $this>
     */
    public function treinos(): HasMany
    {
        return $this->hasMany(Treino::class, 'autor_id');
    }
}
