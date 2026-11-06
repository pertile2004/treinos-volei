<?php

use App\Http\Controllers\Api\V1\ReferenciasController;
use App\Http\Controllers\Api\V1\SaudeController;
use Illuminate\Support\Facades\Route;

Route::get('/saude', SaudeController::class)->name('saude');
Route::get('/referencias', ReferenciasController::class)->name('referencias');
