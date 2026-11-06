<?php

use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Monolog\Formatter\JsonFormatter;
use Monolog\Handler\TestHandler;

it('gera um request id em formato UUID quando o cliente nao envia', function () {
    $resposta = $this->getJson('/api/v1/referencias');

    $id = $resposta->headers->get('X-Request-Id');

    expect(Str::isUuid($id))->toBeTrue()
        ->and(Context::get('request_id'))->toBe($id);
});

it('propaga o request id valido recebido', function () {
    $resposta = $this->getJson('/api/v1/referencias', ['X-Request-Id' => 'cliente-abc.123_XYZ']);

    $resposta->assertHeader('X-Request-Id', 'cliente-abc.123_XYZ');

    expect(Context::get('request_id'))->toBe('cliente-abc.123_XYZ');
});

it('descarta o request id invalido e gera outro', function (string $invalido) {
    $resposta = $this->getJson('/api/v1/referencias', ['X-Request-Id' => $invalido]);

    $id = $resposta->headers->get('X-Request-Id');

    expect($id)->not->toBe($invalido)
        ->and(Str::isUuid($id))->toBeTrue()
        ->and(Context::get('request_id'))->toBe($id);
})->with([
    'caracteres proibidos' => 'a b<script>',
    'curto demais' => 'abc1234',
    'longo demais' => str_repeat('a', 65),
]);

it('devolve o request id tambem em /up', function () {
    $resposta = $this->get('/up', ['X-Request-Id' => 'saude-12345678']);

    $resposta->assertOk()->assertHeader('X-Request-Id', 'saude-12345678');
});

it('usa formatador JSON nos canais daily e stderr', function (string $canal) {
    $manipuladores = Log::channel($canal)->getLogger()->getHandlers();

    expect($manipuladores)->toHaveCount(1)
        ->and($manipuladores[0]->getFormatter())->toBeInstanceOf(JsonFormatter::class);
})->with(['daily', 'stderr']);

it('registra o request id em cada linha do log JSON', function () {
    $monolog = Log::channel('daily')->getLogger();
    $manipulador = new TestHandler;
    $manipulador->setFormatter($monolog->getHandlers()[0]->getFormatter());
    $monolog->setHandlers([$manipulador]);

    Route::get('/api/v1/teste-de-log', function () {
        Log::channel('daily')->info('linha de teste');

        return response()->noContent();
    });

    $this->get('/api/v1/teste-de-log', ['X-Request-Id' => 'log-12345678'])->assertNoContent();

    $registros = $manipulador->getRecords();

    expect($registros)->toHaveCount(1);

    $linha = json_decode((string) $registros[0]->formatted, true, flags: JSON_THROW_ON_ERROR);

    expect($linha['message'])->toBe('linha de teste')
        ->and($linha['level_name'])->toBe('INFO')
        ->and($linha['extra']['request_id'])->toBe('log-12345678');
});

it('usa um canal com formatador JSON quando LOG_CHANNEL nao esta definido', function () {
    $padrao = (require config_path('logging.php'))['default'];

    expect(['daily', 'stderr'])->toContain($padrao);
});
