<?php

namespace App\Providers;

use App\Contracts\VerificadorBanco;
use App\Enums\Papel;
use App\Models\User;
use App\Services\VerificadorBancoPdo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Laravel\Pulse\Facades\Pulse;

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

        // Cartão de uso do Pulse: só nome e id. O resolvedor padrão do pacote monta o
        // avatar em gravatar.com com o hash do e-mail, o que enviaria dado pessoal
        // derivado a um terceiro pelo navegador do admin e bateria na CSP.
        Pulse::user(fn (User $user): array => [
            'name' => $user->name,
            'extra' => 'id '.$user->getKey(),
        ]);
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
