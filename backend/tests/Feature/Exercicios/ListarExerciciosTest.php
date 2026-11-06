<?php

use App\Enums\Fundamento;
use App\Enums\Nivel;
use App\Models\Exercicio;
use App\Models\User;

beforeEach(function () {
    $this->usuario = User::factory()->create();
});

it('exige sessao para listar', function () {
    $resposta = $this->getJson('/api/v1/exercicios');

    $resposta->assertUnauthorized()
        ->assertJsonPath('message', 'Não autenticado.')
        ->assertJsonPath('request_id', $resposta->headers->get('X-Request-Id'));
});

it('lista exercicios resumidos no formato do contrato, para qualquer papel', function (User $usuario) {
    $exercicio = Exercicio::factory()
        ->doFundamento(Fundamento::Recepcao)
        ->doNivel(Nivel::Iniciante)
        ->comVideo('https://www.youtube.com/watch?v=VIDEO-DE-TESTE')
        ->create([
            'nome' => 'Recepção em manchete contra a parede',
            'foco' => 'Plataforma firme e direção da bola',
            'series_padrao' => 3,
            'repeticoes_padrao' => 15,
            'duracao_segundos_padrao' => null,
            'descanso_segundos' => 45,
            'imagem_url' => '/ilustracoes/recepcao.svg',
        ]);

    $resposta = $this->actingAs($usuario)->getJson('/api/v1/exercicios');

    $resposta->assertOk()->assertJsonCount(1, 'data');

    expect($resposta->json('data.0'))->toBe([
        'id' => $exercicio->id,
        'nome' => 'Recepção em manchete contra a parede',
        'foco' => 'Plataforma firme e direção da bola',
        'fundamento' => 'recepcao',
        'fundamento_rotulo' => 'Recepção',
        'nivel' => 'iniciante',
        'nivel_rotulo' => 'Iniciante',
        'series_padrao' => 3,
        'repeticoes_padrao' => 15,
        'duracao_segundos_padrao' => null,
        'descanso_segundos' => 45,
        'tem_video' => true,
        'imagem_url' => '/ilustracoes/recepcao.svg',
    ])
        ->and(array_keys($resposta->json()))->toBe(['data', 'links', 'meta'])
        ->and(array_keys($resposta->json('links')))->toBe(['first', 'last', 'prev', 'next'])
        ->and($resposta->json('meta'))->toMatchArray([
            'current_page' => 1,
            'per_page' => 15,
            'total' => 1,
            'last_page' => 1,
        ]);
})->with([
    'jogador' => fn () => User::factory()->create(),
    'treinador' => fn () => User::factory()->treinador()->create(),
    'admin' => fn () => User::factory()->admin()->create(),
]);

it('usa a ilustracao do fundamento quando o exercicio nao tem imagem propria', function () {
    Exercicio::factory()->doFundamento(Fundamento::Saque)->create(['imagem_url' => null]);

    $this->actingAs($this->usuario)->getJson('/api/v1/exercicios')
        ->assertOk()
        ->assertJsonPath('data.0.imagem_url', '/ilustracoes/saque.svg')
        ->assertJsonPath('data.0.tem_video', false);
});

it('nao expoe na lista o que e do detalhe nem dados internos', function () {
    $admin = User::factory()->admin()->create();
    Exercicio::factory()->for($admin, 'criador')->create();

    $item = $this->actingAs($this->usuario)->getJson('/api/v1/exercicios')->assertOk()->json('data.0');

    expect($item)->not->toHaveKeys(['descricao', 'video_url', 'criado_por', 'deleted_at', 'created_at', 'updated_at']);
});

it('filtra por fundamento e nivel combinados (E)', function () {
    $alvo = Exercicio::factory()->doFundamento(Fundamento::Saque)->doNivel(Nivel::Avancado)->create();
    Exercicio::factory()->doFundamento(Fundamento::Saque)->doNivel(Nivel::Iniciante)->create();
    Exercicio::factory()->doFundamento(Fundamento::Ataque)->doNivel(Nivel::Avancado)->create();

    $resposta = $this->actingAs($this->usuario)->getJson('/api/v1/exercicios?fundamento=saque&nivel=avancado');

    $resposta->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $alvo->id);
});

it('filtra so por fundamento', function () {
    Exercicio::factory()->doFundamento(Fundamento::Bloqueio)->count(2)->create();
    Exercicio::factory()->doFundamento(Fundamento::Defesa)->create();

    $resposta = $this->actingAs($this->usuario)->getJson('/api/v1/exercicios?fundamento=bloqueio');

    $resposta->assertOk()->assertJsonCount(2, 'data');

    expect(collect($resposta->json('data'))->pluck('fundamento')->unique()->all())->toBe(['bloqueio']);
});

it('filtra so por nivel', function () {
    Exercicio::factory()->doNivel(Nivel::Intermediario)->count(3)->create();
    Exercicio::factory()->doNivel(Nivel::Iniciante)->create();

    $resposta = $this->actingAs($this->usuario)->getJson('/api/v1/exercicios?nivel=intermediario');

    $resposta->assertOk()->assertJsonCount(3, 'data');

    expect(collect($resposta->json('data'))->pluck('nivel')->unique()->all())->toBe(['intermediario']);
});

it('combina fundamento, nivel e busca por E', function () {
    $alvo = Exercicio::factory()->doFundamento(Fundamento::Recepcao)->doNivel(Nivel::Iniciante)->create(['nome' => 'Recepção alta']);
    Exercicio::factory()->doFundamento(Fundamento::Recepcao)->doNivel(Nivel::Iniciante)->create(['nome' => 'Manchete na parede']);
    Exercicio::factory()->doFundamento(Fundamento::Recepcao)->doNivel(Nivel::Avancado)->create(['nome' => 'Recepção de saque viagem']);
    Exercicio::factory()->doFundamento(Fundamento::Defesa)->doNivel(Nivel::Iniciante)->create(['nome' => 'Recepção baixa']);

    $resposta = $this->actingAs($this->usuario)
        ->getJson('/api/v1/exercicios?fundamento=recepcao&nivel=iniciante&busca=recep');

    $resposta->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $alvo->id);
});

it('busca pelo nome ignorando acentos e maiusculas', function (string $termo) {
    Exercicio::factory()->create(['nome' => 'Recepção alta']);
    Exercicio::factory()->create(['nome' => 'RECEPÇÃO EM DUPLA']);
    Exercicio::factory()->create(['nome' => 'Saque flutuante']);

    $resposta = $this->actingAs($this->usuario)->getJson('/api/v1/exercicios?busca='.urlencode($termo));

    $resposta->assertOk();

    expect(collect($resposta->json('data'))->pluck('nome')->all())
        ->toEqualCanonicalizing(['Recepção alta', 'RECEPÇÃO EM DUPLA']);
})->with(['recepcao', 'RECEPÇÃO', 'Recepcao', 'recepção']);

it('busca com espacos nas pontas e vazia nao quebra o filtro', function () {
    Exercicio::factory()->create(['nome' => 'Saque flutuante']);
    Exercicio::factory()->create(['nome' => 'Recepção alta']);

    $this->actingAs($this->usuario)->getJson('/api/v1/exercicios?busca='.urlencode('  saque '))
        ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.nome', 'Saque flutuante');

    $this->actingAs($this->usuario)->getJson('/api/v1/exercicios?busca=')
        ->assertOk()->assertJsonCount(2, 'data');
});

it('trata curingas do LIKE como texto comum na busca', function (string $termo) {
    Exercicio::factory()->create(['nome' => 'Saque flutuante']);
    Exercicio::factory()->create(['nome' => 'Recepção alta']);

    $this->actingAs($this->usuario)->getJson('/api/v1/exercicios?busca='.urlencode($termo))
        ->assertOk()->assertJsonCount(0, 'data');
})->with(['porcentagem' => '%', 'sublinhado' => '_', 'barra invertida' => '\\', 'misturado' => 'sa%te']);

it('encontra o nome que contem o curinga literalmente', function () {
    Exercicio::factory()->create(['nome' => 'Saque 100% flutuante']);
    Exercicio::factory()->create(['nome' => 'Saque flutuante']);

    $this->actingAs($this->usuario)->getJson('/api/v1/exercicios?busca='.urlencode('100%'))
        ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.nome', 'Saque 100% flutuante');
});

it('ordena por nome e depois por id', function () {
    $c = Exercicio::factory()->create(['nome' => 'Cortada na diagonal']);
    $a2 = Exercicio::factory()->create(['nome' => 'Ataque de fundo']);
    $a1 = Exercicio::factory()->create(['nome' => 'Ataque de fundo']);
    $b = Exercicio::factory()->create(['nome' => 'Bloqueio simples']);

    $ids = collect($this->actingAs($this->usuario)->getJson('/api/v1/exercicios')->assertOk()->json('data'))
        ->pluck('id')->all();

    expect($ids)->toBe([$a2->id, $a1->id, $b->id, $c->id]);
});

it('deixa de fora o exercicio excluido logicamente (RN-07)', function () {
    $ativo = Exercicio::factory()->create();
    Exercicio::factory()->trashed()->create();

    $this->actingAs($this->usuario)->getJson('/api/v1/exercicios')
        ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $ativo->id);
});

it('pagina de 15 em 15 por padrao e mantem os filtros nos links', function () {
    Exercicio::factory()->doFundamento(Fundamento::Ataque)->count(20)->create();
    Exercicio::factory()->doFundamento(Fundamento::Saque)->count(3)->create();

    $pagina1 = $this->actingAs($this->usuario)->getJson('/api/v1/exercicios?fundamento=ataque');

    $pagina1->assertOk()
        ->assertJsonCount(15, 'data')
        ->assertJsonPath('meta.current_page', 1)
        ->assertJsonPath('meta.per_page', 15)
        ->assertJsonPath('meta.total', 20)
        ->assertJsonPath('meta.last_page', 2)
        ->assertJsonPath('links.prev', null);

    expect($pagina1->json('links.next'))->toContain('page=2')->toContain('fundamento=ataque');

    $pagina2 = $this->actingAs($this->usuario)->getJson('/api/v1/exercicios?fundamento=ataque&page=2');

    $pagina2->assertOk()
        ->assertJsonCount(5, 'data')
        ->assertJsonPath('meta.current_page', 2)
        ->assertJsonPath('links.next', null);

    expect($pagina2->json('links.prev'))->toContain('page=1');
});

it('aceita por_pagina ate 50', function () {
    Exercicio::factory()->count(16)->create();

    $this->actingAs($this->usuario)->getJson('/api/v1/exercicios?por_pagina=50')
        ->assertOk()
        ->assertJsonCount(16, 'data')
        ->assertJsonPath('meta.per_page', 50)
        ->assertJsonPath('meta.last_page', 1);

    $this->actingAs($this->usuario)->getJson('/api/v1/exercicios?por_pagina=5')
        ->assertOk()
        ->assertJsonCount(5, 'data')
        ->assertJsonPath('meta.per_page', 5)
        ->assertJsonPath('meta.last_page', 4);
});

it('responde 422 em portugues para parametros invalidos', function (string $query, string $campo) {
    $resposta = $this->actingAs($this->usuario)->getJson('/api/v1/exercicios?'.$query);

    $resposta->assertUnprocessable()
        ->assertJsonValidationErrors([$campo])
        ->assertJsonPath('request_id', $resposta->headers->get('X-Request-Id'));

    expect(array_keys($resposta->json()))->toEqualCanonicalizing(['message', 'errors', 'request_id'])
        ->and($resposta->json("errors.{$campo}.0"))->toBeString()->not->toBeEmpty();
})->with([
    'fundamento fora do enum' => ['fundamento=cortada', 'fundamento'],
    'nivel fora do enum' => ['nivel=mestre', 'nivel'],
    'busca longa' => ['busca='.str_repeat('a', 101), 'busca'],
    'por_pagina acima de 50' => ['por_pagina=51', 'por_pagina'],
    'por_pagina zero' => ['por_pagina=0', 'por_pagina'],
    'por_pagina texto' => ['por_pagina=muitos', 'por_pagina'],
    'page zero' => ['page=0', 'page'],
    'page texto' => ['page=abc', 'page'],
]);

it('aceita busca com exatamente 100 caracteres', function () {
    $this->actingAs($this->usuario)->getJson('/api/v1/exercicios?busca='.str_repeat('a', 100))
        ->assertOk()->assertJsonCount(0, 'data');
});
