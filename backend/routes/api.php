<?php

use App\Http\Controllers\Api\V1\AgendamentoController;
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

// Rotas que exigem sessão (cookie do Sanctum); a Policy de cada recurso responde 404 ao que não é seu.
Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/agendamentos', [AgendamentoController::class, 'index'])->name('agendamentos.index');
    Route::post('/agendamentos', [AgendamentoController::class, 'store'])->name('agendamentos.store');
    Route::patch('/agendamentos/{agendamento}', [AgendamentoController::class, 'update'])
        ->whereNumber('agendamento')
        ->name('agendamentos.update');
    Route::delete('/agendamentos/{agendamento}', [AgendamentoController::class, 'destroy'])
        ->whereNumber('agendamento')
        ->name('agendamentos.destroy');
});
