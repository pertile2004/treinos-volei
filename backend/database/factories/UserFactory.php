<?php

namespace Database\Factories;

use App\Enums\Papel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nome' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'papel' => Papel::Jogador,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Usuário com papel de treinador (o código de convite continua null).
     */
    public function treinador(): static
    {
        return $this->state(['papel' => Papel::Treinador]);
    }

    /**
     * Usuário com papel de admin.
     */
    public function admin(): static
    {
        return $this->state(['papel' => Papel::Admin]);
    }
}
