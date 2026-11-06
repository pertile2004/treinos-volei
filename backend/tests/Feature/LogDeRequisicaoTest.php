<?php

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Monolog\Formatter\JsonFormatter;
use Monolog\Handler\TestHandler;

/**
 * Troca o manipulador do canal de requisições por um TestHandler que guarda as
 * linhas já formatadas pelo formatador real do canal (JSON).
 */
function capturarLog(): TestHandler
{
    $monolog = Log::channel('requisicoes')->getLogger();
    $manipulador = new TestHandler;
    $manipulador->setFormatter($monolog->getHandlers()[0]->getFormatter());
    $monolog->setHandlers([$manipulador]);

    return $manipulador;
}

/**
 * Devolve a única linha de requisição gravada, decodificada.
 *
 * @return array<string, mixed>
 */
function linhaDeRequisicao(TestHandler $manipulador): array
{
    $linhas = array_values(array_filter(
        $manipulador->getRecords(),
        fn ($registro) => $registro->message === 'requisicao',
    ));

    expect($linhas)->toHaveCount(1);

    return json_decode((string) $linhas[0]->formatted, true, flags: JSON_THROW_ON_ERROR);
}

it('usa um canal proprio de requisicoes com formatador JSON', function () {
    expect(config('logging.requisicoes'))->toBe('requisicoes');

    $manipuladores = Log::channel('requisicoes')->getLogger()->getHandlers();

    expect($manipuladores)->toHaveCount(1)
        ->and($manipuladores[0]->getFormatter())->toBeInstanceOf(JsonFormatter::class);
});

it('grava uma linha de log por requisicao com rota, status, duracao e request id', function () {
    $manipulador = capturarLog();

    $this->getJson('/api/v1/referencias', ['X-Request-Id' => 'req-12345678'])->assertOk();

    $linha = linhaDeRequisicao($manipulador);

    expect($linha['level_name'])->toBe('INFO')
        ->and($linha['context']['request_id'])->toBe('req-12345678')
        ->and($linha['context']['metodo'])->toBe('GET')
        ->and($linha['context']['rota'])->toBe('api/v1/referencias')
        ->and($linha['context']['status'])->toBe(200)
        ->and($linha['context']['duracao_ms'])->toBeNumeric()
        ->and($linha['context']['duracao_ms'])->toBeGreaterThanOrEqual(0)
        ->and($linha['context']['usuario_id'])->toBeNull()
        ->and($linha['extra']['request_id'])->toBe('req-12345678');

    expect(array_keys($linha['context']))->toEqualCanonicalizing([
        'request_id', 'metodo', 'rota', 'status', 'duracao_ms', 'usuario_id',
    ]);
});

it('registra o padrao da rota e nao a URL com ids', function () {
    Route::get('/api/v1/teste-de-rota/{id}', fn (int $id) => response()->noContent());

    $manipulador = capturarLog();

    $this->get('/api/v1/teste-de-rota/987654?email=pessoa@exemplo.com&token=segredo-123')->assertNoContent();

    $linha = linhaDeRequisicao($manipulador);
    $texto = json_encode($linha, JSON_THROW_ON_ERROR);

    expect($linha['context']['rota'])->toBe('api/v1/teste-de-rota/{id}')
        ->and($linha['context']['status'])->toBe(204)
        ->and($texto)->not->toContain('987654')
        ->and($texto)->not->toContain('pessoa@exemplo.com')
        ->and($texto)->not->toContain('segredo-123');
});

it('registra o status 404 de rota inexistente sem rota e sem o caminho pedido', function () {
    $manipulador = capturarLog();

    $this->getJson('/api/v1/nao-existe/pessoa@exemplo.com')->assertNotFound();

    $linha = linhaDeRequisicao($manipulador);

    expect($linha['context']['status'])->toBe(404)
        ->and($linha['context']['rota'])->toBeNull()
        ->and(json_encode($linha, JSON_THROW_ON_ERROR))->not->toContain('pessoa@exemplo.com');
});

it('registra o status 422 sem o corpo enviado', function () {
    Route::post('/api/v1/teste-de-validacao', function (Request $request) {
        $request->validate(['nome' => ['required', 'string'], 'password' => ['required']]);
    });

    $manipulador = capturarLog();

    $this->postJson('/api/v1/teste-de-validacao', [
        'email' => 'pessoa@exemplo.com',
        'password' => 'senha-secreta-123',
    ])->assertStatus(422);

    $linha = linhaDeRequisicao($manipulador);
    $texto = json_encode($linha, JSON_THROW_ON_ERROR);

    expect($linha['context']['status'])->toBe(422)
        ->and($linha['context']['rota'])->toBe('api/v1/teste-de-validacao')
        ->and($linha['context']['metodo'])->toBe('POST')
        ->and($texto)->not->toContain('pessoa@exemplo.com')
        ->and($texto)->not->toContain('senha-secreta-123');
});

it('registra o status 500 quando o controller lanca excecao', function () {
    config(['app.debug' => false]);

    Route::get('/api/v1/teste-de-erro-interno', function () {
        throw new RuntimeException('falhou');
    });

    $manipulador = capturarLog();

    $this->getJson('/api/v1/teste-de-erro-interno')->assertStatus(500);

    expect(linhaDeRequisicao($manipulador)['context']['status'])->toBe(500);
});

it('usa o mesmo request id no header, no JSON de erro e na linha de log', function () {
    $manipulador = capturarLog();

    $resposta = $this->getJson('/api/v1/nao-existe', ['X-Request-Id' => 'ponta-a-ponta-0001']);

    $resposta->assertNotFound()
        ->assertHeader('X-Request-Id', 'ponta-a-ponta-0001')
        ->assertJsonPath('request_id', 'ponta-a-ponta-0001');

    $linha = linhaDeRequisicao($manipulador);

    expect($linha['context']['request_id'])->toBe('ponta-a-ponta-0001')
        ->and($linha['extra']['request_id'])->toBe('ponta-a-ponta-0001');
});

it('gera um request id quando o cliente nao envia e os tres batem', function () {
    $manipulador = capturarLog();

    $resposta = $this->getJson('/api/v1/nao-existe');

    $id = $resposta->headers->get('X-Request-Id');
    $linha = linhaDeRequisicao($manipulador);

    expect(Str::isUuid($id))->toBeTrue()
        ->and($resposta->json('request_id'))->toBe($id)
        ->and($linha['context']['request_id'])->toBe($id)
        ->and($linha['extra']['request_id'])->toBe($id);
});

it('nao copia para o log um request id malformado ou enorme', function (string $invalido) {
    $manipulador = capturarLog();

    $resposta = $this->getJson('/api/v1/referencias', ['X-Request-Id' => $invalido]);

    $id = $resposta->headers->get('X-Request-Id');
    $linha = linhaDeRequisicao($manipulador);
    $texto = (string) json_encode($linha, JSON_THROW_ON_ERROR);

    expect(Str::isUuid($id))->toBeTrue()
        ->and($linha['context']['request_id'])->toBe($id)
        ->and($linha['extra']['request_id'])->toBe($id)
        ->and($texto)->not->toContain('<script>')
        ->and($texto)->not->toContain(str_repeat('a', 65))
        ->and($texto)->not->toContain('"quebra');
})->with([
    'com script' => 'abc<script>alert(1)</script>',
    'enorme' => str_repeat('a', 300),
    'quebra de linha' => "abcdefgh\n\"quebra\":\"de linha\"",
]);

it('registra o id do usuario autenticado', function () {
    $usuario = User::factory()->create();

    $manipulador = capturarLog();

    $this->actingAs($usuario)->getJson('/api/v1/referencias')->assertOk();

    expect(linhaDeRequisicao($manipulador)['context']['usuario_id'])->toBe($usuario->id);
});

it('registra tambem as rotas fora da API', function () {
    $manipulador = capturarLog();

    $this->get('/up')->assertOk();

    $linha = linhaDeRequisicao($manipulador);

    expect($linha['context']['rota'])->toBe('up')
        ->and($linha['context']['status'])->toBe(200);
});

it('nao grava a linha de requisicao no canal padrao da aplicacao', function () {
    $monolog = Log::channel('daily')->getLogger();
    $manipulador = new TestHandler;
    $monolog->setHandlers([$manipulador]);

    $this->getJson('/api/v1/referencias')->assertOk();

    expect($manipulador->getRecords())->toBeEmpty();
});
