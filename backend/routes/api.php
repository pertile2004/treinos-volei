<?php

use App\Http\Controllers\Api\V1\ReferenciasController;
use App\Http\Controllers\Api\V1\SaudeController;
use App\Http\Controllers\Api\V1\SessaoController;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

// A rota de saúde fica fora da sessão: com a sessão no banco, o StartSession
// falharia antes do controller e o SPA veria 500 em vez de 503 com o banco fora.
Route::get('/saude', SaudeController::class)
    ->withoutMiddleware(EnsureFrontendRequestsAreStateful::class)
    ->name('saude');
Route::get('/referencias', ReferenciasController::class)->name('referencias');

// Rotas que exigem usuário logado. O limite "api" (60 por minuto por usuário)
// está definido no AppServiceProvider.
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function (): void {
    Route::post('/sessoes', [SessaoController::class, 'store'])->name('sessoes.store');
    Route::get('/sessoes/{sessao}', [SessaoController::class, 'show'])->name('sessoes.show');
});
