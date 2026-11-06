<?php

namespace App\Providers;

use App\Contracts\VerificadorBanco;
use App\Services\VerificadorBancoPdo;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * @var array<class-string, class-string>
     */
    public array $bindings = [
        VerificadorBanco::class => VerificadorBancoPdo::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Guard de sessão (web) para os services que iniciam ou encerram a sessão.
        $this->app->bind(StatefulGuard::class, fn (): StatefulGuard => Auth::guard('web'));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());

        $this->configurarLimitadores();
    }

    /**
     * Limites por IP das rotas públicas (ESPECIFICACAO > Segurança): cadastro 10/min.
     */
    private function configurarLimitadores(): void
    {
        RateLimiter::for('cadastro', fn (Request $request): Limit => Limit::perMinute(10)->by((string) $request->ip()));
    }
}
