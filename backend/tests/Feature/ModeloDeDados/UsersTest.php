<?php

use App\Enums\Papel;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

it('tem as colunas de users do modelo de dados', function (string $coluna, string $tipo, bool $aceitaNulo) {
    $definicao = collect(Schema::getColumns('users'))->firstWhere('name', $coluna);

    expect($definicao)->not->toBeNull()
        ->and($definicao['type'])->toBe($tipo)
        ->and($definicao['nullable'])->toBe($aceitaNulo);
})->with([
    'nome' => ['nome', 'character varying(100)', false],
    'email' => ['email', 'character varying(255)', false],
    'papel' => ['papel', 'character varying(20)', false],
    'meta_semanal' => ['meta_semanal', 'smallint', false],
    'data_nascimento' => ['data_nascimento', 'date', true],
    'codigo_convite' => ['codigo_convite', 'character(8)', true],
    'treinador_id' => ['treinador_id', 'bigint', true],
]);

it('troca a coluna name por nome', function () {
    expect(Schema::hasColumn('users', 'name'))->toBeFalse()
        ->and(Schema::hasColumn('users', 'nome'))->toBeTrue();
});

it('tem os indices e as unicidades de users', function () {
    expect(Schema::hasIndex('users', ['papel']))->toBeTrue()
        ->and(Schema::hasIndex('users', ['treinador_id']))->toBeTrue()
        ->and(Schema::hasIndex('users', ['codigo_convite'], 'unique'))->toBeTrue()
        ->and(Schema::hasIndex('users', ['email'], 'unique'))->toBeTrue();
});

it('usa meta semanal 3 por padrao no banco e nao aceita usuario sem papel', function () {
    $id = DB::table('users')->insertGetId([
        'nome' => 'Ana Souza',
        'email' => 'ana@example.com',
        'password' => 'hash-qualquer',
        'papel' => 'jogador',
    ]);

    expect(DB::table('users')->where('id', $id)->value('meta_semanal'))->toBe(3);

    expect(fn () => DB::table('users')->insert([
        'nome' => 'Bia Lima',
        'email' => 'bia@example.com',
        'password' => 'hash-qualquer',
    ]))->toThrow(QueryException::class, 'papel');
});

it('ja nasce com meta semanal 3 no model, sem recarregar do banco', function () {
    $usuario = User::create([
        'nome' => 'Ana Souza',
        'email' => 'ana@example.com',
        'password' => 'segredo-123',
        'papel' => Papel::Jogador,
    ]);

    expect($usuario->meta_semanal)->toBe(3)
        ->and($usuario->fresh()->meta_semanal)->toBe(3);
});

it('converte papel, datas e senha pelos casts', function () {
    $usuario = User::factory()->create([
        'papel' => 'treinador',
        'data_nascimento' => '2001-03-15',
        'password' => 'segredo-123',
    ])->fresh();

    expect($usuario->papel)->toBe(Papel::Treinador)
        ->and($usuario->data_nascimento)->toBeInstanceOf(Carbon::class)
        ->and($usuario->data_nascimento->toDateString())->toBe('2001-03-15')
        ->and($usuario->email_verified_at)->toBeInstanceOf(Carbon::class)
        ->and($usuario->meta_semanal)->toBeInt()
        ->and($usuario->password)->not->toBe('segredo-123')
        ->and(Hash::check('segredo-123', $usuario->password))->toBeTrue();

    $this->assertDatabaseHas('users', ['id' => $usuario->id, 'papel' => 'treinador']);
});

it('esconde senha e remember_token ao serializar', function () {
    $dados = User::factory()->create()->toArray();

    expect($dados)
        ->not->toHaveKey('password')
        ->not->toHaveKey('remember_token')
        ->toHaveKeys(['id', 'nome', 'email', 'papel', 'meta_semanal']);
});

it('aceita em massa so os campos do proprio perfil', function () {
    $usuario = new User;

    expect($usuario->getFillable())
        ->toEqualCanonicalizing(['nome', 'email', 'password', 'papel', 'meta_semanal', 'data_nascimento'])
        ->and($usuario->isFillable('codigo_convite'))->toBeFalse()
        ->and($usuario->isFillable('treinador_id'))->toBeFalse();
});

it('liga o treinador aos seus atletas', function () {
    $treinador = User::factory()->treinador()->create();
    $atletas = User::factory()->count(2)->for($treinador, 'treinador')->create();
    $semTreinador = User::factory()->create();

    expect($treinador->atletas()->pluck('id')->all())->toEqualCanonicalizing($atletas->pluck('id')->all())
        ->and($atletas->first()->treinador->is($treinador))->toBeTrue()
        ->and($semTreinador->treinador)->toBeNull();
});

it('mantem o atleta e zera treinador_id quando o treinador e apagado', function () {
    $treinador = User::factory()->treinador()->create();
    $atleta = User::factory()->for($treinador, 'treinador')->create();

    $chave = collect(Schema::getForeignKeys('users'))->firstWhere('columns', ['treinador_id']);

    expect($chave)->not->toBeNull()
        ->and($chave['foreign_table'])->toBe('users')
        ->and($chave['on_delete'])->toBe('set null');

    $treinador->delete();

    $this->assertDatabaseMissing('users', ['id' => $treinador->id]);

    expect($atleta->fresh())->not->toBeNull()
        ->and($atleta->fresh()->treinador_id)->toBeNull();
});

it('nao repete codigo de convite nem e-mail, e aceita varios usuarios sem codigo', function () {
    User::factory()->treinador()->create(['codigo_convite' => 'ABCD2345', 'email' => 'treinador@example.com']);
    User::factory()->count(2)->create();

    expect(User::query()->whereNull('codigo_convite')->count())->toBe(2)
        ->and(fn () => DB::transaction(fn () => User::factory()->treinador()->create(['codigo_convite' => 'ABCD2345'])))
        ->toThrow(UniqueConstraintViolationException::class)
        ->and(fn () => DB::transaction(fn () => User::factory()->create(['email' => 'treinador@example.com'])))
        ->toThrow(UniqueConstraintViolationException::class);
});

it('cria usuarios validos pela factory, com estados de papel', function () {
    $jogador = User::factory()->create();

    expect($jogador->papel)->toBe(Papel::Jogador)
        ->and($jogador->meta_semanal)->toBe(3)
        ->and($jogador->codigo_convite)->toBeNull()
        ->and($jogador->treinador_id)->toBeNull()
        ->and(User::factory()->treinador()->create()->papel)->toBe(Papel::Treinador)
        ->and(User::factory()->admin()->create()->papel)->toBe(Papel::Admin)
        ->and(User::factory()->unverified()->create()->email_verified_at)->toBeNull();
});
