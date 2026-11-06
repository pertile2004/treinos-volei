<?php

use App\Http\Controllers\Api\V1\EstatisticasController;
use App\Http\Controllers\Api\V1\ReferenciasController;
use App\Http\Controllers\Api\V1\SaudeController;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

// A rota de saúde fica fora da sessão: com a sessão no banco, o StartSession
// falharia antes do controller e o SPA veria 500 em vez de 503 com o banco fora.
Route::get('/saude', SaudeController::class)
    ->withoutMiddleware(EnsureFrontendRequestsAreStateful::class)
    ->name('saude');
Route::get('/referencias', ReferenciasController::class)->name('referencias');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/estatisticas', EstatisticasController::class)->name('estatisticas');
});
