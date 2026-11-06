<?php

use App\Enums\Fundamento;
use App\Models\Exercicio;
use App\Models\Sessao;
use App\Models\SessaoSerie;
use App\Models\Treino;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\RateLimiter;

beforeEach(function () {
    $this->usuario = User::factory()->create();
    $this->treino = Treino::factory()->for($this->usuario, 'autor')->create(['nome' => 'Recepção básica']);
    $this->sessao = Sessao::factory()->for($this->usuario, 'usuario')->for($this->treino)->create([
        'iniciada_em' => Carbon::parse('2026-11-06T21:00:00Z'),
        'finalizada_em' => Carbon::parse('2026-11-06T21:38:10Z'),
        'duracao_segundos' => 2100,
        'observacao' => 'Boa sessão',
    ]);
});

it('mostra a sessao do dono com treino e series, sem N+1 no modo estrito', function () {
    $recepcao = Exercicio::factory()->doFundamento(Fundamento::Recepcao)->create(['nome' => 'Manchete na parede']);
    $saque = Exercicio::factory()->doFundamento(Fundamento::Saque)->create(['nome' => 'Saque por cima']);
    SessaoSerie::factory()->for($this->sessao)->for($recepcao)->create(['numero' => 1, 'acertos' => 7, 'erros' => 3]);
    SessaoSerie::factory()->for($this->sessao)->for($recepcao)->create(['numero' => 2, 'acertos' => 8, 'erros' => 2]);
    SessaoSerie::factory()->for($this->sessao)->for($saque)->create(['numero' => 1, 'acertos' => 5, 'erros' => 5]);

    $resposta = $this->actingAs($this->usuario)->getJson("/api/v1/sessoes/{$this->sessao->id}");

    $resposta->assertOk()
        ->assertJsonPath('data.id', $this->sessao->id)
        ->assertJsonPath('data.id_cliente', $this->sessao->id_cliente)
        ->assertJsonPath('data.origem', 'cronometro')
        ->assertJsonPath('data.treino', ['id' => $this->treino->id, 'nome' => 'Recepção básica'])
        ->assertJsonPath('data.iniciada_em', '2026-11-06T21:00:00Z')
        ->assertJsonPath('data.finalizada_em', '2026-11-06T21:38:10Z')
        ->assertJsonPath('data.duracao_segundos', 2100)
        ->assertJsonPath('data.observacao', 'Boa sessão')
        ->assertJsonCount(3, 'data.series')
        ->assertJsonPath('data.series.0.exercicio', ['id' => $recepcao->id, 'nome' => 'Manchete na parede', 'removido' => false])
        ->assertJsonPath('data.series.0.fundamento', 'recepcao')
        ->assertJsonPath('data.series.0.numero', 1)
        ->assertJsonPath('data.series.1.numero', 2)
        ->assertJsonPath('data.series.2.exercicio.nome', 'Saque por cima')
        ->assertJsonPath('data.series.2.fundamento', 'saque');

    expect(array_keys($resposta->json()))->toBe(['data']);
});

it('marca o exercicio removido da biblioteca e mostra o treino excluido logicamente', function () {
    $exercicio = Exercicio::factory()->create();
    SessaoSerie::factory()->for($this->sessao)->for($exercicio)->create();
    $exercicio->delete();
    $this->treino->delete();

    $this->actingAs($this->usuario)->getJson("/api/v1/sessoes/{$this->sessao->id}")
        ->assertOk()
        ->assertJsonPath('data.treino.id', $this->treino->id)
        ->assertJsonPath('data.series.0.exercicio.removido', true);
});

it('devolve treino e exercicio nulos quando foram apagados de vez', function () {
    $exercicio = Exercicio::factory()->create();
    SessaoSerie::factory()->for($this->sessao)->for($exercicio)->create();
    $exercicio->forceDelete();
    $this->treino->forceDelete();

    $this->actingAs($this->usuario)->getJson("/api/v1/sessoes/{$this->sessao->id}")
        ->assertOk()
        ->assertJsonPath('data.treino', null)
        ->assertJsonPath('data.series.0.exercicio', null)
        ->assertJsonPath('data.series.0.fundamento', $this->sessao->series()->first()->fundamento->value);
});

it('responde 404 para sessao de outro usuario, nunca 403', function () {
    $outro = User::factory()->create();

    $this->actingAs($outro)->getJson("/api/v1/sessoes/{$this->sessao->id}")
        ->assertNotFound()
        ->assertJsonPath('message', 'Recurso não encontrado.');
});

it('responde 404 para sessao inexistente', function () {
    $this->actingAs($this->usuario)->getJson('/api/v1/sessoes/999999')
        ->assertNotFound();
});

it('responde 401 sem sessao', function () {
    $this->getJson("/api/v1/sessoes/{$this->sessao->id}")
        ->assertUnauthorized()
        ->assertJsonPath('message', 'Não autenticado.');
});

it('limita a 60 requisicoes por minuto por usuario', function () {
    RateLimiter::clear('api');

    for ($i = 0; $i < 60; $i++) {
        $this->actingAs($this->usuario)->getJson("/api/v1/sessoes/{$this->sessao->id}")->assertOk();
    }

    $this->actingAs($this->usuario)->getJson("/api/v1/sessoes/{$this->sessao->id}")
        ->assertStatus(429)
        ->assertJsonPath('message', 'Muitas tentativas. Tente de novo em instantes.');
});
