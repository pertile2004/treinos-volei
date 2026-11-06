<?php

use App\Enums\Papel;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * @param  array<string, mixed>  $sobrescrever
 * @return array<string, mixed>
 */
function dadosDeCadastro(array $sobrescrever = []): array
{
    return array_merge([
        'nome' => 'Ana Souza',
        'email' => 'ana@example.com',
        'password' => 'segredo-123',
        'password_confirmation' => 'segredo-123',
        'papel' => 'jogador',
        'aceite_termos' => true,
    ], $sobrescrever);
}

beforeEach(function () {
    // O SPA chama a API a partir de uma origem stateful do Sanctum: assim a sessão por cookie entra em cena.
    config(['sanctum.stateful' => ['localhost:5173']]);
    $this->withHeader('Referer', 'http://localhost:5173/cadastro');
});

it('cria a conta, inicia a sessao e responde 201 com o usuario', function () {
    $resposta = $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro());

    $resposta->assertCreated()
        ->assertExactJson([
            'data' => [
                'id' => $resposta->json('data.id'),
                'nome' => 'Ana Souza',
                'email' => 'ana@example.com',
                'papel' => 'jogador',
                'meta_semanal' => 3,
                'data_nascimento' => null,
            ],
        ])
        ->assertCookie(config('session.cookie'));

    $usuario = User::query()->where('email', 'ana@example.com')->firstOrFail();

    expect($usuario->nome)->toBe('Ana Souza')
        ->and($usuario->papel)->toBe(Papel::Jogador)
        ->and($usuario->meta_semanal)->toBe(3)
        ->and($usuario->password)->not->toBe('segredo-123')
        ->and(Hash::check('segredo-123', $usuario->password))->toBeTrue();

    $this->assertAuthenticatedAs($usuario);
});

it('cadastra treinador', function () {
    $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro(['papel' => 'treinador']))
        ->assertCreated()
        ->assertJsonPath('data.papel', 'treinador');

    expect(User::query()->firstOrFail()->papel)->toBe(Papel::Treinador);
});

it('nao expoe a senha nem o remember_token na resposta', function () {
    $resposta = $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro());

    $resposta->assertCreated()
        ->assertJsonMissingPath('data.password')
        ->assertJsonMissingPath('data.remember_token');

    expect(array_keys($resposta->json('data')))
        ->toEqualCanonicalizing(['id', 'nome', 'email', 'papel', 'meta_semanal', 'data_nascimento']);
});

it('responde 422 em email quando o e-mail ja esta em uso', function () {
    User::factory()->create(['email' => 'ana@example.com']);

    $resposta = $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro());

    $resposta->assertUnprocessable()
        ->assertJsonValidationErrors(['email' => 'O e-mail já está em uso.'])
        ->assertJsonPath('message', 'O e-mail já está em uso.')
        ->assertJsonPath('request_id', $resposta->headers->get('X-Request-Id'));

    expect(User::query()->count())->toBe(1);
    $this->assertGuest();
});

it('trata o e-mail sem diferenciar maiusculas e minusculas', function () {
    User::factory()->create(['email' => 'ana@example.com']);

    $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro(['email' => 'Ana@Example.com']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);

    $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro(['email' => '  Bia@Example.com ']))
        ->assertCreated()
        ->assertJsonPath('data.email', 'bia@example.com');
});

it('responde 422 em password quando a senha tem menos de 8 caracteres', function () {
    $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro([
        'password' => '1234567',
        'password_confirmation' => '1234567',
    ]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password' => 'A senha precisa ter no mínimo 8 caracteres.'])
        ->assertJsonMissingValidationErrors(['nome', 'email', 'papel', 'aceite_termos']);

    $this->assertGuest();
});

it('responde 422 em password quando a confirmacao nao confere', function () {
    $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro(['password_confirmation' => 'senha-errada-errada']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password' => 'As senhas não conferem.']);
});

it('responde 422 em nome quando o nome e invalido', function (array $campos) {
    $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro($campos))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['nome'])
        ->assertJsonMissingValidationErrors(['email', 'password', 'papel', 'aceite_termos']);
})->with([
    'um caractere' => [['nome' => 'A']],
    '101 caracteres' => [['nome' => str_repeat('a', 101)]],
    'ausente' => [['nome' => null]],
]);

it('responde 422 em email quando o e-mail e invalido ou ausente', function (array $campos) {
    $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro($campos))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email' => 'Informe um e-mail válido.']);
})->with([
    'sem arroba' => [['email' => 'ana.example.com']],
    'ausente' => [['email' => null]],
]);

it('responde 422 em papel quando o papel e admin, desconhecido ou ausente', function (array $campos) {
    $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro($campos))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['papel'])
        ->assertJsonMissingValidationErrors(['nome', 'email', 'password', 'aceite_termos']);

    expect(User::query()->count())->toBe(0);
})->with([
    'admin' => [['papel' => 'admin']],
    'desconhecido' => [['papel' => 'arbitro']],
    'ausente' => [['papel' => null]],
]);

it('responde 422 em aceite_termos quando os termos nao foram aceitos', function (array $campos) {
    $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro($campos))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['aceite_termos' => 'Você precisa aceitar os termos.']);
})->with([
    'false' => [['aceite_termos' => false]],
    'ausente' => [['aceite_termos' => null]],
]);

it('ignora meta_semanal, codigo_convite e treinador_id enviados pelo cliente', function () {
    $treinador = User::factory()->treinador()->create();

    $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro([
        'meta_semanal' => 7,
        'codigo_convite' => 'ABCD2345',
        'treinador_id' => $treinador->id,
    ]))->assertCreated()->assertJsonPath('data.meta_semanal', 3);

    $usuario = User::query()->where('email', 'ana@example.com')->firstOrFail();

    expect($usuario->meta_semanal)->toBe(3)
        ->and($usuario->codigo_convite)->toBeNull()
        ->and($usuario->treinador_id)->toBeNull();
});

it('responde 429 com request id na decima primeira requisicao do mesmo IP em um minuto', function () {
    foreach (range(1, 10) as $i) {
        $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro(['email' => "pessoa{$i}@example.com"]))
            ->assertCreated();
    }

    $resposta = $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro(['email' => 'pessoa11@example.com']));

    $resposta->assertStatus(429)
        ->assertHeader('Retry-After')
        ->assertExactJson([
            'message' => 'Muitas tentativas. Tente de novo em instantes.',
            'request_id' => $resposta->headers->get('X-Request-Id'),
        ]);

    expect(User::query()->where('email', 'pessoa11@example.com')->exists())->toBeFalse();
});

it('conta no limite tambem as requisicoes invalidas', function () {
    foreach (range(1, 10) as $i) {
        $this->postJson('/api/v1/auth/cadastro', [])->assertUnprocessable();
    }

    $this->postJson('/api/v1/auth/cadastro', dadosDeCadastro())->assertStatus(429);
});
