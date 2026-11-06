<?php

namespace App\Providers;

use App\Contracts\VerificadorBanco;
use App\Enums\Papel;
use App\Models\User;
use App\Services\VerificadorBancoPdo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
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
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());

        // Painel do Pulse (/pulse): só o admin, em qualquer ambiente. Substitui o
        // padrão do pacote, que libera o painel para todos no ambiente local.
        Gate::define('viewPulse', fn (User $user): bool => self::ehAdmin($user));
    }

    /**
     * Lê o papel direto dos atributos brutos: não dispara o modo estrito quando a
     * coluna ainda não existe e aceita tanto o enum quanto o texto gravado no banco.
     */
    private static function ehAdmin(User $user): bool
    {
        $papel = $user->getAttributes()['papel'] ?? null;

        if (! $papel instanceof Papel) {
            $papel = is_string($papel) ? Papel::tryFrom($papel) : null;
        }

        return $papel === Papel::Admin;
    }
}
