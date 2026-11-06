<?php

use App\Enums\Fundamento;
use App\Enums\Nivel;
use App\Models\Exercicio;
use App\Models\User;

beforeEach(function () {
    $this->usuario = User::factory()->create();
});

it('exige sessao para detalhar', function () {
    $exercicio = Exercicio::factory()->create();

    $resposta = $this->getJson("/api/v1/exercicios/{$exercicio->id}");

    $resposta->assertUnauthorized()
        ->assertJsonPath('message', 'Não autenticado.')
        ->assertJsonPath('request_id', $resposta->headers->get('X-Request-Id'));
});

it('detalha o exercicio no formato do contrato', function () {
    $admin = User::factory()->admin()->create();

    $exercicio = Exercicio::factory()
        ->doFundamento(Fundamento::Recepcao)
        ->doNivel(Nivel::Iniciante)
        ->for($admin, 'criador')
        ->create([
            'nome' => 'Recepção em manchete contra a parede',
            'descricao' => 'Fique a 3 m da parede e devolva a bola em manchete.',
            'foco' => 'Plataforma firme e direção da bola',
            'series_padrao' => 3,
            'repeticoes_padrao' => 15,
            'duracao_segundos_padrao' => null,
            'descanso_segundos' => 45,
            'video_url' => null,
            'imagem_url' => '/ilustracoes/recepcao.svg',
        ]);

    $resposta = $this->actingAs($this->usuario)->getJson("/api/v1/exercicios/{$exercicio->id}");

    $resposta->assertOk();

    expect(array_keys($resposta->json()))->toBe(['data'])
        ->and($resposta->json('data'))->toBe([
            'id' => $exercicio->id,
            'nome' => 'Recepção em manchete contra a parede',
            'descricao' => 'Fique a 3 m da parede e devolva a bola em manchete.',
            'foco' => 'Plataforma firme e direção da bola',
            'fundamento' => 'recepcao',
            'fundamento_rotulo' => 'Recepção',
            'nivel' => 'iniciante',
            'nivel_rotulo' => 'Iniciante',
            'series_padrao' => 3,
            'repeticoes_padrao' => 15,
            'duracao_segundos_padrao' => null,
            'descanso_segundos' => 45,
            'video_url' => null,
            'imagem_url' => '/ilustracoes/recepcao.svg',
        ]);
});

it('devolve a video_url e a ilustracao padrao do fundamento no detalhe', function () {
    $exercicio = Exercicio::factory()
        ->doFundamento(Fundamento::PreparoFisico)
        ->porDuracao(40)
        ->comVideo('https://youtu.be/VIDEO-DE-TESTE')
        ->create(['imagem_url' => null]);

    $this->actingAs($this->usuario)->getJson("/api/v1/exercicios/{$exercicio->id}")
        ->assertOk()
        ->assertJsonPath('data.video_url', 'https://youtu.be/VIDEO-DE-TESTE')
        ->assertJsonPath('data.imagem_url', '/ilustracoes/preparo_fisico.svg')
        ->assertJsonPath('data.fundamento_rotulo', 'Preparo físico')
        ->assertJsonPath('data.repeticoes_padrao', null)
        ->assertJsonPath('data.duracao_segundos_padrao', 40)
        ->assertJsonMissingPath('data.tem_video');
});

it('responde 404 para id inexistente, excluido ou nao numerico', function (callable $id) {
    $resposta = $this->actingAs($this->usuario)->getJson('/api/v1/exercicios/'.$id());

    $resposta->assertNotFound()
        ->assertExactJson([
            'message' => 'Recurso não encontrado.',
            'request_id' => $resposta->headers->get('X-Request-Id'),
        ]);
})->with([
    'inexistente' => fn () => Exercicio::factory()->create()->id + 1000,
    'excluido logicamente (RN-07)' => fn () => Exercicio::factory()->trashed()->create()->id,
    'nao numerico' => fn () => 'abc',
]);
